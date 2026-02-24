export const TRADE_TYPES = [
"plumber",
"electrician",
"carpenter",
"painter_decorator",
"roofer",
"tiler",
"plasterer",
"general_builder",
"locksmith",
"heating_engineer",
"appliance_repair",
"gardener",
"flooring_installer",
"window_door_installer"
] as const;

export type TradeType = typeof TRADE_TYPES[number];