-- Add custom text fields for "autre" options in narrative settings
ALTER TABLE exploration_narrative_settings 
ADD COLUMN welcome_tones_custom text CHECK (char_length(welcome_tones_custom) <= 250),
ADD COLUMN welcome_forms_custom text CHECK (char_length(welcome_forms_custom) <= 250),
ADD COLUMN welcome_povs_custom text CHECK (char_length(welcome_povs_custom) <= 250),
ADD COLUMN welcome_senses_custom text CHECK (char_length(welcome_senses_custom) <= 250),
ADD COLUMN welcome_timeframes_custom text CHECK (char_length(welcome_timeframes_custom) <= 250);