-- Extend marche_audio table for transcription support
ALTER TABLE marche_audio 
ADD COLUMN transcription_status TEXT DEFAULT 'none' CHECK (transcription_status IN ('none', 'pending', 'processing', 'completed', 'failed')),
ADD COLUMN transcription_text TEXT,
ADD COLUMN transcription_model VARCHAR(100),
ADD COLUMN transcription_confidence FLOAT,
ADD COLUMN transcription_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN transcription_segments JSONB;

-- Create transcription_models table
CREATE TABLE transcription_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL, -- 'openai', 'huggingface', 'local'
  model_identifier VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  supports_realtime BOOLEAN DEFAULT false,
  languages JSONB DEFAULT '[]'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transcription_models ENABLE ROW LEVEL SECURITY;

-- Create policies for transcription_models
CREATE POLICY "Public can view active transcription models" 
ON transcription_models 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can manage transcription models" 
ON transcription_models 
FOR ALL 
USING (true);

-- Insert default transcription models
INSERT INTO transcription_models (name, provider, model_identifier, is_active, supports_realtime, languages, config) VALUES
('Whisper (OpenAI)', 'openai', 'whisper-1', true, false, '["fr", "en", "es", "de", "it"]'::jsonb, '{"api_endpoint": "https://api.openai.com/v1/audio/transcriptions", "max_file_size": 25000000}'::jsonb),
('Faster-Whisper', 'huggingface', 'openai/whisper-large-v3', true, false, '["fr", "en", "es", "de", "it"]'::jsonb, '{"api_endpoint": "https://api-inference.huggingface.co/models/openai/whisper-large-v3", "max_file_size": 50000000}'::jsonb),
('Wav2Vec2 French', 'huggingface', 'facebook/wav2vec2-large-xlsr-53-french', true, false, '["fr"]'::jsonb, '{"api_endpoint": "https://api-inference.huggingface.co/models/facebook/wav2vec2-large-xlsr-53-french", "max_file_size": 30000000}'::jsonb);

-- Add trigger for updated_at
CREATE TRIGGER update_transcription_models_updated_at
BEFORE UPDATE ON transcription_models
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();