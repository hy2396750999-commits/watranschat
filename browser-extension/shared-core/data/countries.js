/* =====================================================================
 * WATransChat shared-core · data/countries.js
 * 国家/地区大表：供根据联系人区号自动推断客户语言/货币/时区。
 * 纯 JS，挂载到 window.WTC.countries，无 import、无构建依赖。
 *
 * 记录结构：{ code, calling, zh, en, lang, langZh, currency, tz }
 *   code     ISO 3166-1 alpha-2（如 PL）
 *   calling  国际区号，不带 +（如 48、1、7、971）
 *   zh/en    中/英文国家名
 *   lang     常用语言 code（与 config.js LANGUAGES 对齐，如 pl、ar、en、ru）
 *   langZh   该语言中文名
 *   currency ISO 货币代码（如 PLN、USD、EUR）
 *   tz       IANA 时区（如 Europe/Warsaw）
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  var LIST = [];
  function R(code, calling, zh, en, lang, langZh, currency, tz) {
    LIST.push({
      code: code, calling: calling, zh: zh, en: en,
      lang: lang, langZh: langZh, currency: currency, tz: tz
    });
  }

  /* ---------------- 欧洲 ---------------- */
  R('AL', '355', '阿尔巴尼亚', 'Albania', 'sq', '阿尔巴尼亚语', 'ALL', 'Europe/Tirane');
  R('AD', '376', '安道尔', 'Andorra', 'ca', '加泰罗尼亚语', 'EUR', 'Europe/Andorra');
  R('AT', '43', '奥地利', 'Austria', 'de', '德语', 'EUR', 'Europe/Vienna');
  R('BY', '375', '白俄罗斯', 'Belarus', 'be', '白俄罗斯语', 'BYN', 'Europe/Minsk');
  R('BE', '32', '比利时（荷兰语区）', 'Belgium (Dutch)', 'nl', '荷兰语', 'EUR', 'Europe/Brussels');
  R('BE', '32', '比利时（法语区）', 'Belgium (French)', 'fr', '法语', 'EUR', 'Europe/Brussels');
  R('BA', '387', '波斯尼亚和黑塞哥维那', 'Bosnia and Herzegovina', 'bs', '波斯尼亚语', 'BAM', 'Europe/Sarajevo');
  R('BG', '359', '保加利亚', 'Bulgaria', 'bg', '保加利亚语', 'BGN', 'Europe/Sofia');
  R('HR', '385', '克罗地亚', 'Croatia', 'hr', '克罗地亚语', 'EUR', 'Europe/Zagreb');
  R('CY', '357', '塞浦路斯', 'Cyprus', 'el', '希腊语', 'EUR', 'Asia/Nicosia');
  R('CZ', '420', '捷克', 'Czechia', 'cs', '捷克语', 'CZK', 'Europe/Prague');
  R('DK', '45', '丹麦', 'Denmark', 'da', '丹麦语', 'DKK', 'Europe/Copenhagen');
  R('EE', '372', '爱沙尼亚', 'Estonia', 'et', '爱沙尼亚语', 'EUR', 'Europe/Tallinn');
  R('FO', '298', '法罗群岛', 'Faroe Islands', 'fo', '法罗语', 'DKK', 'Atlantic/Faroe');
  R('FI', '358', '芬兰', 'Finland', 'fi', '芬兰语', 'EUR', 'Europe/Helsinki');
  R('FR', '33', '法国', 'France', 'fr', '法语', 'EUR', 'Europe/Paris');
  R('DE', '49', '德国', 'Germany', 'de', '德语', 'EUR', 'Europe/Berlin');
  R('GI', '350', '直布罗陀', 'Gibraltar', 'en', '英语', 'GBP', 'Europe/Gibraltar');
  R('GR', '30', '希腊', 'Greece', 'el', '希腊语', 'EUR', 'Europe/Athens');
  R('HU', '36', '匈牙利', 'Hungary', 'hu', '匈牙利语', 'HUF', 'Europe/Budapest');
  R('IS', '354', '冰岛', 'Iceland', 'is', '冰岛语', 'ISK', 'Atlantic/Reykjavik');
  R('IE', '353', '爱尔兰', 'Ireland', 'en', '英语', 'EUR', 'Europe/Dublin');
  R('IT', '39', '意大利', 'Italy', 'it', '意大利语', 'EUR', 'Europe/Rome');
  R('XK', '383', '科索沃', 'Kosovo', 'sq', '阿尔巴尼亚语', 'EUR', 'Europe/Pristina');
  R('LV', '371', '拉脱维亚', 'Latvia', 'lv', '拉脱维亚语', 'EUR', 'Europe/Riga');
  R('LI', '423', '列支敦士登', 'Liechtenstein', 'de', '德语', 'CHF', 'Europe/Vaduz');
  R('LT', '370', '立陶宛', 'Lithuania', 'lt', '立陶宛语', 'EUR', 'Europe/Vilnius');
  R('LU', '352', '卢森堡', 'Luxembourg', 'fr', '法语', 'EUR', 'Europe/Luxembourg');
  R('MT', '356', '马耳他', 'Malta', 'mt', '马耳他语', 'EUR', 'Europe/Malta');
  R('MD', '373', '摩尔多瓦', 'Moldova', 'ro', '罗马尼亚语', 'MDL', 'Europe/Chisinau');
  R('MC', '377', '摩纳哥', 'Monaco', 'fr', '法语', 'EUR', 'Europe/Monaco');
  R('ME', '382', '黑山', 'Montenegro', 'sr', '塞尔维亚语', 'EUR', 'Europe/Podgorica');
  R('NL', '31', '荷兰', 'Netherlands', 'nl', '荷兰语', 'EUR', 'Europe/Amsterdam');
  R('MK', '389', '北马其顿', 'North Macedonia', 'mk', '马其顿语', 'MKD', 'Europe/Skopje');
  R('NO', '47', '挪威', 'Norway', 'no', '挪威语', 'NOK', 'Europe/Oslo');
  R('PL', '48', '波兰', 'Poland', 'pl', '波兰语', 'PLN', 'Europe/Warsaw');
  R('PT', '351', '葡萄牙', 'Portugal', 'pt', '葡萄牙语', 'EUR', 'Europe/Lisbon');
  R('RO', '40', '罗马尼亚', 'Romania', 'ro', '罗马尼亚语', 'RON', 'Europe/Bucharest');
  R('RU', '7', '俄罗斯', 'Russia', 'ru', '俄语', 'RUB', 'Europe/Moscow');
  R('SM', '378', '圣马力诺', 'San Marino', 'it', '意大利语', 'EUR', 'Europe/San_Marino');
  R('RS', '381', '塞尔维亚', 'Serbia', 'sr', '塞尔维亚语', 'RSD', 'Europe/Belgrade');
  R('SK', '421', '斯洛伐克', 'Slovakia', 'sk', '斯洛伐克语', 'EUR', 'Europe/Bratislava');
  R('SI', '386', '斯洛文尼亚', 'Slovenia', 'sl', '斯洛文尼亚语', 'EUR', 'Europe/Ljubljana');
  R('ES', '34', '西班牙', 'Spain', 'es', '西班牙语', 'EUR', 'Europe/Madrid');
  R('SE', '46', '瑞典', 'Sweden', 'sv', '瑞典语', 'SEK', 'Europe/Stockholm');
  R('CH', '41', '瑞士（德语区）', 'Switzerland (German)', 'de', '德语', 'CHF', 'Europe/Zurich');
  R('CH', '41', '瑞士（法语区）', 'Switzerland (French)', 'fr', '法语', 'CHF', 'Europe/Zurich');
  R('UA', '380', '乌克兰', 'Ukraine', 'uk', '乌克兰语', 'UAH', 'Europe/Kyiv');
  R('GB', '44', '英国', 'United Kingdom', 'en', '英语', 'GBP', 'Europe/London');
  R('VA', '379', '梵蒂冈', 'Vatican City', 'it', '意大利语', 'EUR', 'Europe/Vatican');
  R('GE', '995', '格鲁吉亚', 'Georgia', 'ka', '格鲁吉亚语', 'GEL', 'Asia/Tbilisi');
  R('AM', '374', '亚美尼亚', 'Armenia', 'hy', '亚美尼亚语', 'AMD', 'Asia/Yerevan');
  R('AZ', '994', '阿塞拜疆', 'Azerbaijan', 'az', '阿塞拜疆语', 'AZN', 'Asia/Baku');
  R('TR', '90', '土耳其', 'Türkiye', 'tr', '土耳其语', 'TRY', 'Europe/Istanbul');
  R('GL', '299', '格陵兰', 'Greenland', 'kl', '格陵兰语', 'DKK', 'America/Nuuk');

  /* ---------------- 独联体 / 中亚 / 东亚 ---------------- */
  R('KZ', '7', '哈萨克斯坦', 'Kazakhstan', 'kk', '哈萨克语', 'KZT', 'Asia/Almaty');
  R('UZ', '998', '乌兹别克斯坦', 'Uzbekistan', 'uz', '乌兹别克语', 'UZS', 'Asia/Tashkent');
  R('TM', '993', '土库曼斯坦', 'Turkmenistan', 'tk', '土库曼语', 'TMT', 'Asia/Ashgabat');
  R('KG', '996', '吉尔吉斯斯坦', 'Kyrgyzstan', 'ky', '吉尔吉斯语', 'KGS', 'Asia/Bishkek');
  R('TJ', '992', '塔吉克斯坦', 'Tajikistan', 'tg', '塔吉克语', 'TJS', 'Asia/Dushanbe');
  R('MN', '976', '蒙古', 'Mongolia', 'mn', '蒙古语', 'MNT', 'Asia/Ulaanbaatar');
  R('CN', '86', '中国', 'China', 'zh-CN', '中文（简体）', 'CNY', 'Asia/Shanghai');
  R('HK', '852', '中国香港', 'Hong Kong', 'zh', '中文', 'HKD', 'Asia/Hong_Kong');
  R('MO', '853', '中国澳门', 'Macau', 'zh', '中文', 'MOP', 'Asia/Macau');
  R('TW', '886', '中国台湾', 'Taiwan', 'zh-TW', '中文（繁体）', 'TWD', 'Asia/Taipei');
  R('JP', '81', '日本', 'Japan', 'ja', '日语', 'JPY', 'Asia/Tokyo');
  R('KR', '82', '韩国', 'South Korea', 'ko', '韩语', 'KRW', 'Asia/Seoul');
  R('KP', '850', '朝鲜', 'North Korea', 'ko', '韩语', 'KPW', 'Asia/Pyongyang');

  /* ---------------- 南亚 / 东南亚 ---------------- */
  R('IN', '91', '印度', 'India', 'hi', '印地语', 'INR', 'Asia/Kolkata');
  R('PK', '92', '巴基斯坦', 'Pakistan', 'ur', '乌尔都语', 'PKR', 'Asia/Karachi');
  R('BD', '880', '孟加拉国', 'Bangladesh', 'bn', '孟加拉语', 'BDT', 'Asia/Dhaka');
  R('LK', '94', '斯里兰卡', 'Sri Lanka', 'si', '僧伽罗语', 'LKR', 'Asia/Colombo');
  R('NP', '977', '尼泊尔', 'Nepal', 'ne', '尼泊尔语', 'NPR', 'Asia/Kathmandu');
  R('BT', '975', '不丹', 'Bhutan', 'dz', '宗卡语', 'BTN', 'Asia/Thimphu');
  R('MV', '960', '马尔代夫', 'Maldives', 'dv', '迪维希语', 'MVR', 'Indian/Maldives');
  R('MM', '95', '缅甸', 'Myanmar', 'my', '缅甸语', 'MMK', 'Asia/Yangon');
  R('TH', '66', '泰国', 'Thailand', 'th', '泰语', 'THB', 'Asia/Bangkok');
  R('KH', '855', '柬埔寨', 'Cambodia', 'km', '高棉语', 'KHR', 'Asia/Phnom_Penh');
  R('LA', '856', '老挝', 'Laos', 'lo', '老挝语', 'LAK', 'Asia/Vientiane');
  R('VN', '84', '越南', 'Vietnam', 'vi', '越南语', 'VND', 'Asia/Ho_Chi_Minh');
  R('MY', '60', '马来西亚', 'Malaysia', 'ms', '马来语', 'MYR', 'Asia/Kuala_Lumpur');
  R('SG', '65', '新加坡', 'Singapore', 'en', '英语', 'SGD', 'Asia/Singapore');
  R('ID', '62', '印度尼西亚', 'Indonesia', 'id', '印尼语', 'IDR', 'Asia/Jakarta');
  R('PH', '63', '菲律宾', 'Philippines', 'fil', '菲律宾语', 'PHP', 'Asia/Manila');
  R('TL', '670', '东帝汶', 'Timor-Leste', 'pt', '葡萄牙语', 'USD', 'Asia/Dili');
  R('BN', '673', '文莱', 'Brunei', 'ms', '马来语', 'BND', 'Asia/Brunei');

  /* ---------------- 中东 / 阿拉伯 ---------------- */
  R('AF', '93', '阿富汗', 'Afghanistan', 'fa', '波斯语', 'AFN', 'Asia/Kabul');
  R('IR', '98', '伊朗', 'Iran', 'fa', '波斯语', 'IRR', 'Asia/Tehran');
  R('AE', '971', '阿联酋', 'United Arab Emirates', 'ar', '阿拉伯语', 'AED', 'Asia/Dubai');
  R('SA', '966', '沙特阿拉伯', 'Saudi Arabia', 'ar', '阿拉伯语', 'SAR', 'Asia/Riyadh');
  R('QA', '974', '卡塔尔', 'Qatar', 'ar', '阿拉伯语', 'QAR', 'Asia/Qatar');
  R('KW', '965', '科威特', 'Kuwait', 'ar', '阿拉伯语', 'KWD', 'Asia/Kuwait');
  R('BH', '973', '巴林', 'Bahrain', 'ar', '阿拉伯语', 'BHD', 'Asia/Bahrain');
  R('OM', '968', '阿曼', 'Oman', 'ar', '阿拉伯语', 'OMR', 'Asia/Muscat');
  R('IL', '972', '以色列', 'Israel', 'he', '希伯来语', 'ILS', 'Asia/Jerusalem');
  R('PS', '970', '巴勒斯坦', 'Palestine', 'ar', '阿拉伯语', 'ILS', 'Asia/Gaza');
  R('JO', '962', '约旦', 'Jordan', 'ar', '阿拉伯语', 'JOD', 'Asia/Amman');
  R('LB', '961', '黎巴嫩', 'Lebanon', 'ar', '阿拉伯语', 'LBP', 'Asia/Beirut');
  R('SY', '963', '叙利亚', 'Syria', 'ar', '阿拉伯语', 'SYP', 'Asia/Damascus');
  R('IQ', '964', '伊拉克', 'Iraq', 'ar', '阿拉伯语', 'IQD', 'Asia/Baghdad');
  R('YE', '967', '也门', 'Yemen', 'ar', '阿拉伯语', 'YER', 'Asia/Aden');

  /* ---------------- 非洲（北部） ---------------- */
  R('EG', '20', '埃及', 'Egypt', 'ar', '阿拉伯语', 'EGP', 'Africa/Cairo');
  R('MA', '212', '摩洛哥', 'Morocco', 'ar', '阿拉伯语', 'MAD', 'Africa/Casablanca');
  R('DZ', '213', '阿尔及利亚', 'Algeria', 'ar', '阿拉伯语', 'DZD', 'Africa/Algiers');
  R('TN', '216', '突尼斯', 'Tunisia', 'ar', '阿拉伯语', 'TND', 'Africa/Tunis');
  R('LY', '218', '利比亚', 'Libya', 'ar', '阿拉伯语', 'LYD', 'Africa/Tripoli');
  R('SD', '249', '苏丹', 'Sudan', 'ar', '阿拉伯语', 'SDG', 'Africa/Khartoum');
  R('SS', '211', '南苏丹', 'South Sudan', 'en', '英语', 'SSP', 'Africa/Juba');
  R('ET', '251', '埃塞俄比亚', 'Ethiopia', 'am', '阿姆哈拉语', 'ETB', 'Africa/Addis_Ababa');
  R('DJ', '253', '吉布提', 'Djibouti', 'fr', '法语', 'DJF', 'Africa/Djibouti');
  R('ER', '291', '厄立特里亚', 'Eritrea', 'ti', '提格里尼亚语', 'ERN', 'Africa/Asmara');
  R('SO', '252', '索马里', 'Somalia', 'so', '索马里语', 'SOS', 'Africa/Mogadishu');

  /* ---------------- 非洲（西非） ---------------- */
  R('NG', '234', '尼日利亚', 'Nigeria', 'en', '英语', 'NGN', 'Africa/Lagos');
  R('GH', '233', '加纳', 'Ghana', 'en', '英语', 'GHS', 'Africa/Accra');
  R('SN', '221', '塞内加尔', 'Senegal', 'fr', '法语', 'XOF', 'Africa/Dakar');
  R('CI', '225', '科特迪瓦', "Côte d'Ivoire", 'fr', '法语', 'XOF', 'Africa/Abidjan');
  R('ML', '223', '马里', 'Mali', 'fr', '法语', 'XOF', 'Africa/Bamako');
  R('BF', '226', '布基纳法索', 'Burkina Faso', 'fr', '法语', 'XOF', 'Africa/Ouagadougou');
  R('NE', '227', '尼日尔', 'Niger', 'fr', '法语', 'XOF', 'Africa/Niamey');
  R('TD', '235', '乍得', 'Chad', 'fr', '法语', 'XAF', 'Africa/Ndjamena');
  R('CF', '236', '中非', 'Central African Republic', 'fr', '法语', 'XAF', 'Africa/Bangui');
  R('TG', '228', '多哥', 'Togo', 'fr', '法语', 'XOF', 'Africa/Lome');
  R('BJ', '229', '贝宁', 'Benin', 'fr', '法语', 'XOF', 'Africa/Porto-Novo');
  R('GW', '245', '几内亚比绍', 'Guinea-Bissau', 'pt', '葡萄牙语', 'XOF', 'Africa/Bissau');
  R('GN', '224', '几内亚', 'Guinea', 'fr', '法语', 'GNF', 'Africa/Conakry');
  R('SL', '232', '塞拉利昂', 'Sierra Leone', 'en', '英语', 'SLE', 'Africa/Freetown');
  R('LR', '231', '利比里亚', 'Liberia', 'en', '英语', 'LRD', 'Africa/Monrovia');
  R('GM', '220', '冈比亚', 'Gambia', 'en', '英语', 'GMD', 'Africa/Banjul');
  R('GQ', '240', '赤道几内亚', 'Equatorial Guinea', 'es', '西班牙语', 'XAF', 'Africa/Malabo');
  R('ST', '239', '圣多美和普林西比', 'Sao Tome and Principe', 'pt', '葡萄牙语', 'STN', 'Africa/Sao_Tome');
  R('CV', '238', '佛得角', 'Cape Verde', 'pt', '葡萄牙语', 'CVE', 'Atlantic/Cape_Verde');

  /* ---------------- 非洲（中部 / 东部 / 南部） ---------------- */
  R('CM', '237', '喀麦隆', 'Cameroon', 'fr', '法语', 'XAF', 'Africa/Douala');
  R('CG', '242', '刚果（布）', 'Republic of the Congo', 'fr', '法语', 'XAF', 'Africa/Brazzaville');
  R('CD', '243', '刚果（金）', 'DR Congo', 'fr', '法语', 'CDF', 'Africa/Kinshasa');
  R('GA', '241', '加蓬', 'Gabon', 'fr', '法语', 'XAF', 'Africa/Libreville');
  R('RW', '250', '卢旺达', 'Rwanda', 'rw', '卢旺达语', 'RWF', 'Africa/Kigali');
  R('BI', '257', '布隆迪', 'Burundi', 'fr', '法语', 'BIF', 'Africa/Bujumbura');
  R('KE', '254', '肯尼亚', 'Kenya', 'sw', '斯瓦希里语', 'KES', 'Africa/Nairobi');
  R('TZ', '255', '坦桑尼亚', 'Tanzania', 'sw', '斯瓦希里语', 'TZS', 'Africa/Dar_es_Salaam');
  R('UG', '256', '乌干达', 'Uganda', 'en', '英语', 'UGX', 'Africa/Kampala');
  R('ZA', '27', '南非', 'South Africa', 'en', '英语', 'ZAR', 'Africa/Johannesburg');
  R('ZW', '263', '津巴布韦', 'Zimbabwe', 'en', '英语', 'ZWL', 'Africa/Harare');
  R('ZM', '260', '赞比亚', 'Zambia', 'en', '英语', 'ZMW', 'Africa/Lusaka');
  R('MW', '265', '马拉维', 'Malawi', 'en', '英语', 'MWK', 'Africa/Blantyre');
  R('MZ', '258', '莫桑比克', 'Mozambique', 'pt', '葡萄牙语', 'MZN', 'Africa/Maputo');
  R('AO', '244', '安哥拉', 'Angola', 'pt', '葡萄牙语', 'AOA', 'Africa/Luanda');
  R('NA', '264', '纳米比亚', 'Namibia', 'en', '英语', 'NAD', 'Africa/Windhoek');
  R('BW', '267', '博茨瓦纳', 'Botswana', 'en', '英语', 'BWP', 'Africa/Gaborone');
  R('LS', '266', '莱索托', 'Lesotho', 'en', '英语', 'LSL', 'Africa/Maseru');
  R('SZ', '268', '斯威士兰', 'Eswatini', 'en', '英语', 'SZL', 'Africa/Mbabane');
  R('MU', '230', '毛里求斯', 'Mauritius', 'en', '英语', 'MUR', 'Indian/Mauritius');
  R('SC', '248', '塞舌尔', 'Seychelles', 'en', '英语', 'SCR', 'Indian/Mahe');
  R('MG', '261', '马达加斯加', 'Madagascar', 'fr', '法语', 'MGA', 'Indian/Antananarivo');
  R('KM', '269', '科摩罗', 'Comoros', 'ar', '阿拉伯语', 'KMF', 'Indian/Comoro');
  R('RE', '262', '留尼汪', 'Réunion', 'fr', '法语', 'EUR', 'Indian/Reunion');
  R('SH', '290', '圣赫勒拿', 'Saint Helena', 'en', '英语', 'SHP', 'Atlantic/St_Helena');

  /* ---------------- 北美 ---------------- */
  R('US', '1', '美国', 'United States', 'en', '英语', 'USD', 'America/New_York');
  R('CA', '1', '加拿大（英语区）', 'Canada (English)', 'en', '英语', 'CAD', 'America/Toronto');
  R('CA', '1', '加拿大（魁北克法语区）', 'Canada (Québec)', 'fr', '法语', 'CAD', 'America/Montreal');
  R('MX', '52', '墨西哥', 'Mexico', 'es', '西班牙语', 'MXN', 'America/Mexico_City');

  /* ---------------- 中美洲 ---------------- */
  R('GT', '502', '危地马拉', 'Guatemala', 'es', '西班牙语', 'GTQ', 'America/Guatemala');
  R('BZ', '501', '伯利兹', 'Belize', 'en', '英语', 'BZD', 'America/Belize');
  R('SV', '503', '萨尔瓦多', 'El Salvador', 'es', '西班牙语', 'USD', 'America/El_Salvador');
  R('HN', '504', '洪都拉斯', 'Honduras', 'es', '西班牙语', 'HNL', 'America/Tegucigalpa');
  R('NI', '505', '尼加拉瓜', 'Nicaragua', 'es', '西班牙语', 'NIO', 'America/Managua');
  R('CR', '506', '哥斯达黎加', 'Costa Rica', 'es', '西班牙语', 'CRC', 'America/Costa_Rica');
  R('PA', '507', '巴拿马', 'Panama', 'es', '西班牙语', 'USD', 'America/Panama');
  R('CU', '53', '古巴', 'Cuba', 'es', '西班牙语', 'CUP', 'America/Havana');
  R('HT', '509', '海地', 'Haiti', 'fr', '法语', 'HTG', 'America/Port-au-Prince');

  /* ---------------- 加勒比（NANP 长前缀） ---------------- */
  R('JM', '1876', '牙买加', 'Jamaica', 'en', '英语', 'JMD', 'America/Jamaica');
  R('BS', '1242', '巴哈马', 'Bahamas', 'en', '英语', 'BSD', 'America/Nassau');
  R('BB', '1246', '巴巴多斯', 'Barbados', 'en', '英语', 'BBD', 'America/Barbados');
  R('TT', '1868', '特立尼达和多巴哥', 'Trinidad and Tobago', 'en', '英语', 'TTD', 'America/Port_of_Spain');
  R('DO', '1809', '多米尼加共和国', 'Dominican Republic', 'es', '西班牙语', 'DOP', 'America/Santo_Domingo');
  R('PR', '1787', '波多黎各', 'Puerto Rico', 'es', '西班牙语', 'USD', 'America/Puerto_Rico');
  R('AG', '1268', '安提瓜和巴布达', 'Antigua and Barbuda', 'en', '英语', 'XCD', 'America/Antigua');
  R('AI', '1264', '安圭拉', 'Anguilla', 'en', '英语', 'XCD', 'America/Anguilla');
  R('BM', '1441', '百慕大', 'Bermuda', 'en', '英语', 'BMD', 'Atlantic/Bermuda');
  R('KY', '1345', '开曼群岛', 'Cayman Islands', 'en', '英语', 'KYD', 'America/Cayman');
  R('DM', '1767', '多米尼克', 'Dominica', 'en', '英语', 'XCD', 'America/Dominica');
  R('GD', '1473', '格林纳达', 'Grenada', 'en', '英语', 'XCD', 'America/Grenada');
  R('MS', '1664', '蒙特塞拉特', 'Montserrat', 'en', '英语', 'XCD', 'America/Montserrat');
  R('SX', '1721', '荷属圣马丁', 'Sint Maarten', 'nl', '荷兰语', 'ANG', 'America/Lower_Princes');
  R('LC', '1758', '圣卢西亚', 'Saint Lucia', 'en', '英语', 'XCD', 'America/St_Lucia');
  R('VC', '1784', '圣文森特和格林纳丁斯', 'Saint Vincent and the Grenadines', 'en', '英语', 'XCD', 'America/St_Vincent');
  R('KN', '1869', '圣基茨和尼维斯', 'Saint Kitts and Nevis', 'en', '英语', 'XCD', 'America/St_Kitts');
  R('TC', '1649', '特克斯和凯科斯群岛', 'Turks and Caicos Islands', 'en', '英语', 'USD', 'America/Grand_Turk');
  R('VG', '1284', '英属维尔京群岛', 'British Virgin Islands', 'en', '英语', 'USD', 'America/Tortola');
  R('VI', '1340', '美属维尔京群岛', 'U.S. Virgin Islands', 'en', '英语', 'USD', 'America/St_Thomas');
  R('GU', '1671', '关岛', 'Guam', 'en', '英语', 'USD', 'Pacific/Guam');
  R('AS', '1684', '美属萨摩亚', 'American Samoa', 'en', '英语', 'USD', 'Pacific/Pago_Pago');
  R('AW', '297', '阿鲁巴', 'Aruba', 'nl', '荷兰语', 'AWG', 'America/Aruba');
  R('CW', '599', '库拉索', 'Curaçao', 'nl', '荷兰语', 'ANG', 'America/Curacao');
  R('GP', '590', '瓜德罗普', 'Guadeloupe', 'fr', '法语', 'EUR', 'America/Guadeloupe');
  R('MQ', '596', '马提尼克', 'Martinique', 'fr', '法语', 'EUR', 'America/Martinique');

  /* ---------------- 南美洲 ---------------- */
  R('VZ', '58', '委内瑞拉', 'Venezuela', 'es', '西班牙语', 'VES', 'America/Caracas');
  R('CO', '57', '哥伦比亚', 'Colombia', 'es', '西班牙语', 'COP', 'America/Bogota');
  R('EC', '593', '厄瓜多尔', 'Ecuador', 'es', '西班牙语', 'USD', 'America/Guayaquil');
  R('PE', '51', '秘鲁', 'Peru', 'es', '西班牙语', 'PEN', 'America/Lima');
  R('BO', '591', '玻利维亚', 'Bolivia', 'es', '西班牙语', 'BOB', 'America/La_Paz');
  R('CL', '56', '智利', 'Chile', 'es', '西班牙语', 'CLP', 'America/Santiago');
  R('AR', '54', '阿根廷', 'Argentina', 'es', '西班牙语', 'ARS', 'America/Argentina/Buenos_Aires');
  R('UY', '598', '乌拉圭', 'Uruguay', 'es', '西班牙语', 'UYU', 'America/Montevideo');
  R('PY', '595', '巴拉圭', 'Paraguay', 'es', '西班牙语', 'PYG', 'America/Asuncion');
  R('BR', '55', '巴西', 'Brazil', 'pt', '葡萄牙语', 'BRL', 'America/Sao_Paulo');
  R('GY', '592', '圭亚那', 'Guyana', 'en', '英语', 'GYD', 'America/Guyana');
  R('SR', '597', '苏里南', 'Suriname', 'nl', '荷兰语', 'SRD', 'America/Paramaribo');
  R('GF', '594', '法属圭亚那', 'French Guiana', 'fr', '法语', 'EUR', 'America/Cayenne');

  /* ---------------- 大洋洲 ---------------- */
  R('AU', '61', '澳大利亚', 'Australia', 'en', '英语', 'AUD', 'Australia/Sydney');
  R('NZ', '64', '新西兰', 'New Zealand', 'en', '英语', 'NZD', 'Pacific/Auckland');
  R('PG', '675', '巴布亚新几内亚', 'Papua New Guinea', 'en', '英语', 'PGK', 'Pacific/Port_Moresby');
  R('FJ', '679', '斐济', 'Fiji', 'en', '英语', 'FJD', 'Pacific/Fiji');
  R('SB', '677', '所罗门群岛', 'Solomon Islands', 'en', '英语', 'SBD', 'Pacific/Guadalcanal');
  R('VU', '678', '瓦努阿图', 'Vanuatu', 'en', '英语', 'VUV', 'Pacific/Efate');
  R('NC', '687', '新喀里多尼亚', 'New Caledonia', 'fr', '法语', 'XPF', 'Pacific/Noumea');
  R('WS', '685', '萨摩亚', 'Samoa', 'sm', '萨摩亚语', 'WST', 'Pacific/Apia');
  R('TO', '676', '汤加', 'Tonga', 'to', '汤加语', 'TOP', 'Pacific/Tongatapu');
  R('TV', '688', '图瓦卢', 'Tuvalu', 'en', '英语', 'TVD', 'Pacific/Funafuti');
  R('KI', '686', '基里巴斯', 'Kiribati', 'en', '英语', 'KIR', 'Pacific/Tarawa');
  R('NR', '674', '瑙鲁', 'Nauru', 'en', '英语', 'AUD', 'Pacific/Nauru');
  R('PW', '680', '帕劳', 'Palau', 'en', '英语', 'USD', 'Pacific/Palau');
  R('FM', '691', '密克罗尼西亚联邦', 'Micronesia', 'en', '英语', 'USD', 'Pacific/Chuuk');
  R('MH', '692', '马绍尔群岛', 'Marshall Islands', 'en', '英语', 'USD', 'Pacific/Majuro');
  R('CK', '682', '库克群岛', 'Cook Islands', 'en', '英语', 'NZD', 'Pacific/Rarotonga');
  R('NU', '683', '纽埃', 'Niue', 'en', '英语', 'NZD', 'Pacific/Niue');
  R('TK', '690', '托克劳', 'Tokelau', 'en', '英语', 'NZD', 'Pacific/Fakaofo');

  /* ================= 索引与查询 ================= */

  /* 加拿大主要区号（NANP 内与美国共享 +1，按区号区分） */
  var CA_AREAS = {};
  ('204 226 236 250 289 306 343 367 368 403 416 418 431 438 450 506 514 519 548 579 581 587 604 613 639 647 705 709 778 780 819 825 867 873 902 905')
    .split(' ').forEach(function (a) { CA_AREAS[a] = true; });

  /* 哈萨克斯坦在 +7 下的移动/主要区号（与俄罗斯共享 +7，按前缀区分） */
  var KZ_PREFIXES = ['700', '701', '702', '705', '707', '717', '727', '747', '771', '775', '776', '777', '778', '779'];

  function cleanDigits(s) {
    return String(s == null ? '' : s).replace(/[^\d]/g, '');
  }

  /* calling -> 首条记录；同时按区号长度降序，便于最长前缀匹配 */
  var byCalling = {};
  LIST.forEach(function (r) {
    if (!byCalling[r.calling]) byCalling[r.calling] = r;
  });
  var codeKeys = Object.keys(byCalling).sort(function (a, b) { return b.length - a.length; });

  function recordByCode(code) {
    for (var i = 0; i < LIST.length; i++) {
      if (LIST[i].code === code) return LIST[i];
    }
    return null;
  }

  /* 按「最长区号前缀」匹配；未命中返回 null。
   * 对共享前缀做二次消歧：1=美国/加拿大（按加拿大区号），7=俄罗斯/哈萨克斯坦（按哈国前缀）。 */
  function lookupByPhone(raw) {
    var d = cleanDigits(raw);
    if (!d) return null;
    if (d.indexOf('00') === 0) d = d.slice(2);

    var best = null, bestLen = 0;
    for (var i = 0; i < codeKeys.length; i++) {
      var c = codeKeys[i];
      if (d.indexOf(c) === 0 && c.length > bestLen) {
        best = byCalling[c];
        bestLen = c.length;
      }
    }
    if (!best) return null;

    /* 1：美国 / 加拿大 */
    if (best.code === 'US') {
      var area = d.slice(1, 4);
      if (CA_AREAS[area]) return recordByCode('CA') || best;
    }
    /* 7：俄罗斯 / 哈萨克斯坦 */
    if (best.code === 'RU') {
      var rest = d.slice(1);
      for (var j = 0; j < KZ_PREFIXES.length; j++) {
        if (rest.indexOf(KZ_PREFIXES[j]) === 0) return recordByCode('KZ') || best;
      }
    }
    return best;
  }

  /* 按区号取第一条记录（入参可带 +，内部清洗） */
  function findByCalling(code) {
    var c = cleanDigits(code);
    return byCalling[c] || null;
  }

  WTC.countries = {
    list: LIST,
    lookupByPhone: lookupByPhone,
    findByCalling: findByCalling
  };
})();
