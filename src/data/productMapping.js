export const categories = [
    'Active_Speaker',
    // 'Measurement_System',
    'Passive_Speaker',
    'Processor',
    // 'Rack_Amplifier'
];

export const categoryModels = {
    'Active_Speaker': [
        'DVS_10P_SP', 'DVS_115_SW_iSP', 'DVS_118_SW_iSP', 'DVS_12P_iSP',
        'DVS_15P_iSP', 'DVS_8P_SP', 'FLYSUB_15_iSP', 'HARD115_SP'
    ],
    'Passive_Speaker': [
        'AI_41', 'AI_81', 'ARENA_215_CX', 'AS_6', 'BUTTERFLY_CDH_483',
        'Charlie_4', 'DBS_18_2', 'EIDOS_108S',
        // ... add all passive speaker models
    ],
    'Processor': [
        'Genius_24', 'Genius_26', 'Genius_M_412', 'iP_24', 'iP_24_v2',
        'Newton_16', 'Newton_16_4', 'Newton_16_8'
    ],
    // ... add other categories
};

export const modelSymptomAreas = {
    // Newton processors
    'Newton_16': ['Audio', 'Connections', 'Control_Software', 'Dante', 'Firmware', 'Mechanics', 'Power'],
    'Newton_16_4': ['Audio', 'Connections', 'Control_Software', 'Dante', 'Firmware', 'Mechanics', 'Power'],
    'Newton_16_8': ['Audio', 'Connections', 'Control_Software', 'Dante', 'Firmware', 'Mechanics', 'Power'],
    'Genius_24': ['Audio', 'Connections', 'Control_Software', 'Mechanics', 'Power'],
    'Genius_26': ['Audio', 'Connections', 'Control_Software', 'Mechanics', 'Power'],
    'Genius_M_412': ['Audio', 'Connections', 'Control_Software', 'Mechanics', 'Power'],
    
    // DVS Series
    'DVS_10P_SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker'],
    'DVS_115_SW_iSP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker'],
    'DVS_118_SW_iSP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker'],
    'DVS_12P_iSP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker'],
    'DVS_15P_iSP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker'],
    'DVS_8P_SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker'],
    'FLYSUB_15_iSP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker'],
    'HARD115_SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker'],
    'HARD212_SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker'],
    'HARD212NET_SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker'],
    'HARD45_SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker'],
    'iSM_112': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker'],
    'iSM_115': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker'],
    'iSM_212': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker'],

    // Passive Speakers
    'AI_41': ['Audio_', 'Cabinet', 'Speaker'],
    'AI_81': ['Audio_', 'Cabinet', 'Speaker'],
    'ARENA_215_CX': ['Audio_', 'Cabinet', 'Speaker'],
    'AS_6': ['Audio_', 'Cabinet', 'Speaker'],
    'BUTTERFLY_CDH_483': ['Audio_', 'Cabinet', 'Hardware', 'Speaker']
};

// Default symptom areas per category
export const defaultSymptomAreas = {
    'Active_Speaker': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker'],
    'Passive_Speaker': ['Audio_', 'Cabinet', 'Speaker'],
    'Processor': ['Audio', 'Connections', 'Control_Software', 'Firmware', 'Mechanics', 'Power'],
    'Rack_Amplifier': ['Audio', 'Power', 'DSP', 'Hardware'],
    'Measurement_System': ['Audio_', 'Hardware', 'Electronics']
};

export const symptomsByArea = {
    'Audio': [
        'Audio channel on protection', 'Audio level problem', 'Balance problem',
        'Crosstalk', 'Distorted audio', 'Excessive audio level', 'Hiss', 'Hum',
        'No audio', 'No muting', 'No or poor bass', 'No or poor treble',
        'Noisy audio', 'Offset voltage too high', 'Poor frequency response',
        'Pop or click noise', 'Scratching noise'
    ],
    'Power': [
        "Can't power up", 'Keep restarting', 'Power up but doesn\'t work',
        'Start up too slow', 'Switches off by itself'
    ],
    // ... add other areas
};

export const mainVoltageTypes = [
    'Single_phase',
    'Bi_phase',
    'Three_phase_with_neutral',
    'Three_phase_without_neutral'
];

export const mainVoltageRanges = {
    'Single_phase': ['<100VAC', '200-240V'],
    'Bi_phase': ['200-240V', '>240V'],
    'Three_phase_with_neutral': ['>240VAC'],
    'Three_phase_without_neutral': ['>240VAC']
};

export const outputLoadOptions = ['2 Ohm', '4 Ohm', '8 Ohm', '16 Ohm', '>16 Ohm', 'Disconnected'];
export const loadConnectionModes = ['Single ended', 'Bridged', 'Parallel'];

export const symptomOccurrences = [
    'After a while',
    'After long time switched off',
    'After product upgrade',
    'Constantly',
    'Due to a physical damage',
    'In a cold environment',
    'In a hot environment',
    'In a wet environment',
    'Intermittently',
    'Liquid contamination',
    'One time event',
    'Switched on the first time',
    'Under stressed condition',
    'Under vibration',
    'When switching'
];

export const installationTypes = [
    'Airport', 'Rail Station', 'Cinema', 'Theatre', 'Museum',
    'Club / Disco', 'Pub', 'Concert', 'Touring Rental', 'Mall',
    'Conference', 'Church', 'Boat', 'Laboratory'
];

export const voltageTypes = {
    'Active_Speaker': ['Single_phase', 'Bi_phase'],
    'Processor': ['Single_phase', 'Three_phase_with_neutral', 'Three_phase_without_neutral'],
    'Rack_Amplifier': ['Single_phase', 'Bi_phase', 'Three_phase_with_neutral'],
    // Add other categories as needed
};

export const voltageRangesByType = {
    'Single_phase': ['<100VAC', '200-240V'],
    'Bi_phase': ['200-240V', '>240V'],
    'Three_phase_with_neutral': ['>240VAC'],
    'Three_phase_without_neutral': ['>240VAC']
};
