import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RealEstateStepRequest {
  logId: string;
  marcheId: string;
  latitude: number;
  longitude: number;
  marcheName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { logId, marcheId, latitude, longitude, marcheName }: RealEstateStepRequest = await req.json();
    console.log(`🏠 Processing real estate for marche: ${marcheName || marcheId}`);

    // Update log with current marche being processed
    await supabase
      .from('data_collection_logs')
      .update({
        summary_stats: {
          current_marche_name: marcheName || 'Marché inconnu',
          current_data_type: '🏠 Collecte immobilier...',
          marche_start_time: new Date().toISOString()
        },
        last_ping: new Date().toISOString()
      })
      .eq('id', logId);

    // Call lexicon-proxy with retries
    let realEstateData = null;
    let error = null;
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt + 1}/${maxRetries + 1} for lexicon-proxy`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
        
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/lexicon-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({ latitude, longitude }),
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        realEstateData = await response.json();
        console.log(`✅ Lexicon data received for ${marcheName}`);
        break;
        
      } catch (err) {
        error = err;
        console.warn(`⚠️ Attempt ${attempt + 1} failed:`, err.message);
        
        if (attempt < maxRetries) {
          const backoffMs = 400 * Math.pow(2, attempt); // 400ms, 800ms
          console.log(`⏳ Retrying in ${backoffMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    if (!realEstateData && error) {
      console.error(`❌ All attempts failed for ${marcheName}:`, error);
      
      // Update error count in log
      const { data: currentLog } = await supabase
        .from('data_collection_logs')
        .select('errors_count, summary_stats, marches_processed')
        .eq('id', logId)
        .single();
      
      if (currentLog) {
        await supabase
          .from('data_collection_logs')
          .update({
            errors_count: (currentLog.errors_count || 0) + 1,
            summary_stats: {
              ...currentLog.summary_stats,
              current_data_type: 'Erreur ❌',
              error: error.message
            },
            marches_processed: (currentLog.marches_processed || 0) + 1,
            last_ping: new Date().toISOString()
          })
          .eq('id', logId);
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Process and store real estate data
    let transactionsCount = 0;
    let transactionsData = [];
    let avgPriceM2 = null;
    let medianPriceM2 = null;
    let totalVolume = null;

    // Extract transactions from lexicon data structure
    if (realEstateData?.data?.transactions?.rows) {
      transactionsData = realEstateData.data.transactions.rows;
      transactionsCount = transactionsData.length;
      
      if (transactionsCount > 0) {
        console.log(`📊 Found ${transactionsCount} transactions`);
        
        // Calculate price metrics if price data is available
        const prices = transactionsData
          .map(t => t.price)
          .filter(p => p && typeof p === 'number' && p > 0);
          
        if (prices.length > 0) {
          avgPriceM2 = prices.reduce((sum, p) => sum + p, 0) / prices.length;
          totalVolume = prices.reduce((sum, p) => sum + p, 0);
          
          const sortedPrices = prices.sort((a, b) => a - b);
          const mid = Math.floor(sortedPrices.length / 2);
          medianPriceM2 = sortedPrices.length % 2 === 0 
            ? (sortedPrices[mid - 1] + sortedPrices[mid]) / 2
            : sortedPrices[mid];
        }
      }
    } else {
      console.log(`📊 No transactions found for ${marcheName}`);
    }

    // Store real estate snapshot
    const { error: insertError } = await supabase
      .from('real_estate_snapshots')
      .insert({
        marche_id: marcheId,
        latitude,
        longitude,
        transactions_count: transactionsCount,
        transactions_data: transactionsData,
        avg_price_m2: avgPriceM2,
        median_price_m2: medianPriceM2,
        total_volume: totalVolume,
        raw_data: realEstateData?.data || realEstateData,
        source: 'lexicon'
      });

    if (insertError) {
      console.error('❌ Failed to insert real estate data:', insertError);
      throw insertError;
    }

    // Update collection log progress
    const { data: currentLog } = await supabase
      .from('data_collection_logs')
      .select('marches_processed, summary_stats')
      .eq('id', logId)
      .single();

    if (currentLog) {
      const newProcessed = (currentLog.marches_processed || 0) + 1;
      const processedIds = currentLog.summary_stats?.processed_ids || [];
      
      await supabase
        .from('data_collection_logs')
        .update({
          marches_processed: newProcessed,
          summary_stats: {
            ...currentLog.summary_stats,
            processed: newProcessed,
            processed_ids: [...processedIds, marcheId],
            current_data_type: '🏠 Immobilier traité ✅',
            transactions_found: transactionsCount
          },
          last_ping: new Date().toISOString()
        })
        .eq('id', logId);
    }

    console.log(`✅ Real estate data processed successfully for ${marcheName}`);
    
    return new Response(JSON.stringify({
      success: true,
      transactionsCount,
      avgPriceM2,
      medianPriceM2
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Real estate step error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});