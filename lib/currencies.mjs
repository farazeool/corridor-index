// Currency of each country in the World Bank price data (ISO 3166 alpha-3 -> ISO 4217).
// KSV is the World Bank's code for Kosovo. Dollarised economies use USD.
export const CURRENCY = {
  AFG: "AFN", AGO: "AOA", ALB: "ALL", ARE: "AED", ARM: "AMD", AUS: "AUD", AUT: "EUR", BEL: "EUR",
  BGD: "BDT", BGR: "BGN", BHR: "BHD", BIH: "BAM", BOL: "BOB", BRA: "BRL", BWA: "BWP", CAN: "CAD",
  CHE: "CHF", CHL: "CLP", CHN: "CNY", CIV: "XOF", CMR: "XAF", COD: "CDF", COL: "COP", COM: "KMF",
  CPV: "CVE", CRI: "CRC", CUB: "CUP", CZE: "CZK", DEU: "EUR", DOM: "DOP", DZA: "DZD", ECU: "USD",
  EGY: "EGP", ERI: "ERN", ESP: "EUR", ETH: "ETB", FJI: "FJD", FRA: "EUR", GBR: "GBP", GHA: "GHS",
  GMB: "GMD", GTM: "GTQ", GUY: "GYD", HND: "HNL", HRV: "EUR", HTI: "HTG", HUN: "HUF", IDN: "IDR",
  IND: "INR", ISR: "ILS", ITA: "EUR", JAM: "JMD", JOR: "JOD", JPN: "JPY", KEN: "KES", KGZ: "KGS",
  KHM: "KHR", KOR: "KRW", KSV: "EUR", KWT: "KWD", LAO: "LAK", LBN: "LBP", LBR: "LRD", LKA: "LKR",
  LSO: "LSL", LTU: "EUR", MAR: "MAD", MDA: "MDL", MDG: "MGA", MEX: "MXN", MKD: "MKD", MLI: "XOF",
  MMR: "MMK", MOZ: "MZN", MWI: "MWK", MYS: "MYR", NAM: "NAD", NGA: "NGN", NIC: "NIO", NLD: "EUR",
  NOR: "NOK", NPL: "NPR", NZL: "NZD", OMN: "OMR", PAK: "PKR", PAN: "USD", PER: "PEN", PHL: "PHP",
  POL: "PLN", PRT: "EUR", PRY: "PYG", PSE: "ILS", QAT: "QAR", ROU: "RON", RWA: "RWF", SAU: "SAR",
  SDN: "SDG", SEN: "XOF", SGP: "SGD", SLE: "SLE", SLV: "USD", SOM: "SOS", SRB: "RSD", SSD: "SSP",
  SUR: "SRD", SWE: "SEK", SWZ: "SZL", SYR: "SYP", THA: "THB", TGO: "XOF", TJK: "TJS", TON: "TOP",
  TUN: "TND", TUR: "TRY", TZA: "TZS", UGA: "UGX", UKR: "UAH", USA: "USD", VNM: "VND", VUT: "VUV",
  WSM: "WST", YEM: "YER", ZAF: "ZAR", ZMB: "ZMW", ZWE: "ZWG",
};

// Sending and receiving currencies the fetch script asks Binance P2P about.
export const SEND_CURRENCIES = ["KWD", "SAR", "AED", "QAR", "OMR", "BHD", "USD", "GBP", "EUR", "JPY", "MYR", "SGD", "ZAR", "AUD", "CAD", "KRW", "CHF", "NZD", "SEK", "NOK", "CZK", "PLN", "THB"];
export const RECEIVE_CURRENCIES = ["PKR", "INR", "BDT", "PHP", "EGP", "NPR", "LKR", "IDR", "VND", "KES", "UGX", "TZS", "GHS", "ZMW", "MWK", "MXN", "GTQ", "HNL", "COP", "ETB", "JOD", "MAD", "TRY", "UAH", "CNY", "BRL", "XOF", "NGN", "ZAR", "EUR", "PEN", "DOP", "BOB", "PYG", "CRC", "NIO", "JMD", "HTG", "XAF", "RWF", "MYR", "THB", "KHR", "MMK", "LKR", "DZD", "TND", "LBP", "BAM", "RSD", "ALL", "MDL", "RON", "BGN", "HUF", "PLN", "KGS", "TJS", "AMD", "GEL", "SOS", "SSP", "YER", "AFN", "BWP", "MZN", "AOA", "NAD", "LSL", "SZL", "GMD", "SLE", "LRD", "CVE", "KMF", "MGA", "CDF", "ERN", "FJD", "TOP", "WST", "VUV", "SRD", "GYD", "CUP", "SDG", "SYP", "ILS", "LAK", "MKD", "ZWG", "AED"];
