# -*- coding: utf-8 -*-
"""
Builds the site product catalog from the pharmacy's inventory export.

Input : the manager's Excel file  رصيد الأصناف فى جميع المخازن.xlsx
        (sheet columns: كود | إسم الصنف | سعر البيع | الشركة | الوحدة | <branch> | الإجمالى)
Output: src/data/catalog.generated.js  (consumed by src/data/products.js)

Re-run whenever the pharmacy sends an updated stock file:
    pip install openpyxl
    python scripts/build-catalog.py  path/to/new-inventory.xlsx
"""
import sys, os, io, re, json, argparse
from collections import Counter, defaultdict

try:
    import openpyxl
except ImportError:
    sys.exit("openpyxl is required:  pip install openpyxl")

# --------------------------------------------------------------------------
# 1. READ THE SHEET
# --------------------------------------------------------------------------
def read_rows(path):
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    ws = wb.active
    raw = list(ws.iter_rows(values_only=True))
    # row 0 = big title, row 1 = header, rest = data
    out = []
    for r in raw[2:]:
        cells = list(r) + [None] * 7
        code, name, price, company, unit, qty = cells[0], cells[1], cells[2], cells[3], cells[4], cells[5]
        if name is None or str(name).strip() == "":
            continue
        out.append({
            "code": str(code).strip(),
            "name": re.sub(r"\s+", " ", str(name)).strip(),
            "price": price if isinstance(price, (int, float)) else float(str(price).replace(",", "") or 0),
            "company": (str(company).strip() if company else ""),
            "unit": (str(unit).strip() if unit else ""),
            "qty": qty if isinstance(qty, (int, float)) else 0,
        })
    return out


# --------------------------------------------------------------------------
# 2. CATEGORY CLASSIFIER
#    Ordered rules, first match wins. Tuned for the retail sections the
#    pharmacy cares about (cosmetics / fragrance / baby / hair colour /
#    skin / personal care); anything that is clearly a pharmaceutical
#    falls through to "medicine".
# --------------------------------------------------------------------------
def RX(p):
    return re.compile(p, re.I)

RULES = [
    # ---------- ADULT INCONTINENCE (before baby "diaper") ----------
    ("devices", RX(r"\badult diaper|\badult (pull ?up|pants)\b|حفاضات كبار|حفاض كبار|حفاض بامبرز كبير")),

    # ---------- HAIR COLOUR (before hair care & before "cream/gel") ----------
    ("haircolor", RX(r"\bhair colou?r(?! ?protect)")),
    ("haircolor", RX(r"\b(palette|garnier)\b.{0,20}\bcolou?r\b")),
    ("haircolor", RX(r"\bcolou?r\b.{0,12}\b(cream|naturals?)\b")),
    ("haircolor", RX(r"\bcolou?r (cream|naturals?)\b")),
    ("haircolor", RX(r"\b(l'?oreal|loreal)\b.{0,20}\b(excellence|casting|preference|majirel|inoa)\b")),
    ("haircolor", RX(r"\b(excellence|casting)\b.{0,12}\bcr[eè]me\b")),
    ("haircolor", RX(r"\bcolorsilk\b")),
    ("haircolor", RX(r"\bbigen\b")),
    ("haircolor", RX(r"\b(wella|koleston|kolestone|londa color|igora|movida|nutrisse|inecto|olia|logona|herbatint|godefroy|revlonissimo)\b")),
    # henna: real dye (has a colour word or a shade), NOT the conditioning "hair cream with henna"
    ("haircare", RX(r"\bhair cream\b.{0,20}\bhenna\b|\bvatika\b.{0,20}\bhair cream\b")),
    ("haircolor", RX(r"\bhenna\b|حن[هة]\b|حناء")),
    ("haircolor", RX(r"صبغ")),
    ("haircolor", RX(r"\b(hair (dye|tint)|root touch ?up|colou?r restoring (cream|creme)|grey ?coverage|black again|youthair)\b")),

    # ---------- FRAGRANCE / DEODORANT SPRAYS ----------
    ("fragrance", RX(r"\be\.?\s?d\.?\s?(p|t|parfum|toilette|cologne)\b")),
    ("fragrance", RX(r"\beau de (parfum|toilette|cologne)\b")),
    ("fragrance", RX(r"\bbody (spray|mist|fragrance|parfum|splash)\b")),
    ("fragrance", RX(r"\bhair (mist|parfum)\b")),
    ("fragrance", RX(r"\b(perfume|parfum|cologne)\b|كولونيا|كولون|عطر|برفان|مخمري[ةه]|makhm")),
    ("fragrance", RX(r"\bdeo(dorant)?\b.{0,12}\bspray\b")),
    ("fragrance", RX(r"\b(adidas|axe|armaf|zak|bariq)\b.{0,30}\b(spray|parfum|edp|edt|stick|mist)\b")),

    # ---------- BABY & MOTHER ----------
    ("baby", RX(r"\b(diaper|diapers|dipers?|nappy|nappies|pamper|pampers|molfix|huggies|bambo|babyjoy)\b")),
    ("baby", RX(r"\bbaby ?joy\b|\bbebe ?joy\b|حفاض")),
    ("baby", RX(r"\b(nan|s-?26|s26|aptamil|preaptamil|bebelac|bebejunior|similac|nactalia|novalac|hero baby|bebiko|infacare|infatrini|nutramigen|pregestimil|neocate|celia|frezylac|biomil|nutrilon|kabrita|pediasure|nutren junior|cerelac|nestogen|nutrilon)\b")),
    ("baby", RX(r"\b(follow[- ]?on|infant formula|baby milk|growing up milk|growth formula|premature milk)\b")),
    ("baby", RX(r"حليب (اطفال|رضع|بيبي)|لبن اطفال|سيريلاك")),
    ("baby", RX(r"\b(feeding bottle|baby bottle|biberon|beb[er]?on|bebron|tetina|tetena|tetine|teat|soother|dummy|pacifier|teether|nipple( shield| \d| 2 ?psc|s)?|breast ?pump|nursing pad|milk storage)\b")),
    ("baby", RX(r"رضاع[ةه]|تيتين|لهاي[ةه]|سكات[ةه]|سكاته|حلمة|شفاط لبن|بيبرون")),
    ("baby", RX(r"\bbaby\b.{0,20}\b(shampoo|lotion|oil|cream|powder|wash|gel|soap|cologne|wipes|bath|sponge|nasal|cough|drops|syrup|teeth|gum)\b")),
    ("baby", RX(r"\b(baby|infant|kids?|children|child|junior)\b.{0,20}\b(gripe|colic|wind|teething|vitamin d|multivitamin)\b")),
    ("baby", RX(r"\b(mothercare|mamypoko|sanosan|chicco|avent|tommee tippee|dr ?brown|bubbles (soother|feeding|normal|bevele)|baby time|bebedor|bebek)\b")),
    ("baby", RX(r"\bbebe\b|بيبي")),

    # ---------- MAKE-UP / COSMETICS ----------
    ("cosmetics", RX(r"\b(lip ?stick|lip ?gloss|lip ?liner|lip ?tint|lip ?stain|liquid lip|matte lip|lip lacquer|lip crayon|lip (kit|palette))\b")),
    ("cosmetics", RX(r"\b(mascara|mascra|eye ?liner|eye ?shadow|eyeshadow|kajal|brow (pencil|gel|mascara|pomade|kit)|eyebrow pencil|lash (glue|serum|lift))\b|كحل|مسكار")),
    ("cosmetics", RX(r"\b(foundation|concealer|colou?r corrector|bb cream|cc cream|face primer|make ?up (primer|fixer|base|setter)|setting (spray|powder)|fixer spray|compact powder|loose powder|pressed powder|face powder|blush(er)?|highlighter|illuminator|bronzer|contour (kit|stick|palette)|make ?up palette|tinted moisturi)\b")),
    ("cosmetics", RX(r"\b(nail (polish|enamel|lacquer|colou?r|hardener|art)|top coat|base coat|matt top coat)\b|مناكير|طلاء اظافر")),
    ("cosmetics", RX(r"\bmake ?-? ?up\b(?!.{0,15}(remover|wipe|cleans))")),
    ("cosmetics", RX(r"\b(maybelline|max ?factor|essence (matte|liquid|lip|cosmetic)|golden rose|l\.?a\.? girl|\bnyx\b|catrice|note cosmetic|flormar|topface|miss rose|pastel cosmetic|milani|wet ?n ?wild|bourjois|cybele|might cinema|dmgm|christine|clazel|imagic|huda|drakon white eye)\b")),
    ("cosmetics", RX(r"\b(false lash|eyelash(es)?|makeup brush|beauty blender|makeup sponge|make up sponge|cotton .* make ?up|makeup remov(al|er) .* (buds|pads|cotton))\b")),
    ("cosmetics", RX(r"\bcolou?r (lens|lenses|contact)\b|\b(bella|amara|anesthesia|dahab) .{0,20}\blens(es)?\b")),

    # ---------- HAIR CARE ----------
    ("haircare", RX(r"\b(shampoo|shampo|conditioner|co-?wash|hair colou?r protect)\b")),
    ("haircare", RX(r"\bhair (oil|serum|cream|mask|spray|gel|wax|lotion|tonic|food|butter|milk|mousse|fib(er|re)s?|filler|booster|ampoule|ampoules|treatment|thickener|primer|leave.?in)\b")),
    ("haircare", RX(r"\b(anti[- ]?dandruff|anti[- ]?hair ?loss|hair ?fall|hair ?growth|hair regrowth|scalp (treatment|serum|lotion|scrub)|densi[- ]?solutions|dercos|aminexil|neopeptide)\b")),
    ("haircare", RX(r"\b(minoxidil|redensyl|procapil|capixyl|anaphase|hairgain|revivscalp)\b")),
    ("haircare", RX(r"\b(keratin (treatment|shot|mask|hair)|heat protect(ant|ion)|hair straighten|blow ?dry (cream|spray))\b")),
    ("haircare", RX(r"\b(styling (gel|wax|cream|mousse|paste)|edge control|pomade|hair ?spray|hairspray|setting lotion|curl (cream|定))\b")),
    ("haircare", RX(r"شامبو|بلسم شعر|بلسم\b|زيت شعر|كريم شعر|جل شعر|سيروم شعر|مثبت شعر|حمام كريم")),
    ("haircare", RX(r"\b(dabur|vatika|parachute|pantene|head ?& ?shoulders|h&s\b|tresemme|sunsilk|garnier fructis|gliss|schwarzkopf (gliss|professional)|batiste|\bogx\b|cantu|shea moisture|hairfinity|alpecin|hair ?food|palmers .* hair)\b")),

    # ---------- ORAL CARE ----------
    ("oral", RX(r"\b(tooth ?paste|tooth ?brush|tooth ?powder|mouth ?wash|mouth ?rinse|dental floss|floss (picks?|thread|holder)|inter ?dental|denture (cleanser|adhesive|fixative|tablet)|whitening (strips?|pen|kit|powder)|teeth whitening|tongue (cleaner|scraper)|miswak|oral gel .* teeth)\b|معجون اسنان|فرشا[ةه] اسنان|غسول فم|خيط اسنان|سواك|بودر[ةه] تبييض اسنان")),
    ("oral", RX(r"\b(oral[- ]?b|sensodyne|listerine|colgate|signal|parodontax|corsodyl|elmex|meridol|close ?up|crest|aquafresh|lacalut|splat|biorepair|curaprox|fluoride (gel|toothpaste)|kin toothpaste|emoform|sensikin)\b")),

    # ---------- SUN & SKIN CARE (dermo-cosmetics) ----------
    ("skincare", RX(r"\b(sun ?screen|sun ?block|sun ?milk|sun defense|sun (fluid|invisible|lip|cream|gel)|after ?sun|spf ?\d+|uv (shield|protect|aqua|filter))\b")),
    ("skincare", RX(r"\b(face (wash|cleanser|scrub|serum|cream|gel|mask|mist|toner|peel|oil|foam|wipe)|facial (wash|cleanser|foam|scrub|toner|serum|mask)|double facial wash)\b")),
    ("skincare", RX(r"\b(micellar (water|solution)|cleansing (water|milk|gel|foam|balm|oil|mousse)|make ?up remover|makeup remover|eye ?& ?lip remover)\b")),
    ("skincare", RX(r"\b(moisturi[sz](er|ing (cream|lotion|gel|milk))|day cream|night cream|eye (cream|contour|serum|gel|patch|roll)|anti[- ]?(aging|ageing|wrinkle|spot|dark ?circle|pigment)|whitening (cream|serum|gel|night)|brightening (cream|serum|day)|de ?pigment|lightening cream|glow (cream|serum)|retinal booster|retinol serum)\b")),
    ("skincare", RX(r"\b(hyaluronic acid|niacinamide serum|vitamin c (serum|booster)|salicylic acid (cleanser|gel)|azelaic acid|glycolic acid|centella|cica (cream|gel|balm)|snail mucin|ceramide (cream|serum))\b")),
    ("skincare", RX(r"\b(acne (cream|gel|wash|patch|treatment|kit|prone|spot|foam)|anti[- ]?acne|blackhead|black ?head|pore (strip|vacuum|minimi)|pimple patch|spot corrector|comedone)\b")),
    ("skincare", RX(r"\b(body (lotion|butter|scrub|milk|serum)|hand ?cream|hand ?& ?nail cream|foot ?cream|cracked heel|heel (balm|cream)|stretch ?mark|cellulite (gel|cream)|firming (gel|cream)|slimming (gel|cream))\b")),
    ("skincare", RX(r"\b(bioderma|la roche[- ]?posay|vichy|eucerin|cerave|cetaphil|av[eè]ne|isis ?pharma|\bsvr\b|filorga|uriage|a[- ]?derma|noreva|sesderma|bioxcin|neutrogena|olay|the ordinary|inkey list|beesline|clean ?& ?clear|st\.? ?ives|aveeno|pond'?s|dermedic|pharmaceris|hollywood style|hydroderm|starville|dermina|\ba\.?c\.?m\b|klapp|byphasse|garnier (skin|micellar|pure|naturals face)|cosrx|nuxe|caudalie|bioxsine|ordinary|alejon|atrakta|arencia|azha|ventamor|youlicious|andoderma|attica mattica|argento|aquacare|hayah|jn |oznaturals|drakon white|melano|depiwhite|melblok|hydraquin)\b")),
    ("skincare", RX(r"غسول (وجه|بشرة|للوجه)|كريم مرطب|واقي شمس|واقى شمس|سيروم|مقشر|تونر|كريم تفتيح|ماسك للوجه|لوشن (جسم|للجسم)|كريم (لليدين|للقدمين|تشققات)")),
    ("skincare", RX(r"\b(exfoliating (cream|gel|scrub|glove|soap|mask|lip scrub)|gel exfoliant|peeling (gel|solution|cream|mask)|melasma|melano|depi ?white|melblok|meladerm|whitening peel)\b")),

    # ---------- INTIMATE / SEXUAL WELLNESS ----------
    ("intimate", RX(r"\b(condoms?(?! catheter)|durex|contex|ritex|delay spray|climax control|personal lubricant|intimate (gel|lubricant)|k-?y jelly)\b|واقي ذكري|كوندوم")),
    ("intimate", RX(r"\b(pregnancy test|home pregnancy|ovulation test|fertility test|hcg (test|strip)|midstream test)\b|اختبار حمل|شريط حمل")),
    ("intimate", RX(r"\b(feminine wash|intimate wash|vaginal (wash|douche|moisturi)|ph care|lactacyd|femarelle|gynecleen|saugella|femfresh|femina)\b|غسول مهبلي|غسول نسائي")),

    # ---------- PERSONAL CARE ----------
    ("personal", RX(r"\b(deodorant|deodrant|anti[- ]?perspirant|roll[- ]?on|deo (stick|roll|cream)|deo\b)\b|مزيل عرق|مزيل العرق")),
    ("personal", RX(r"\b(soap|bar soap|beauty soap|bath soap|medicated soap|glycerin(e)? soap|shower gel|body wash|bath (foam|gel|milk)|bubble bath|shower cream|hammam|dead sea (mud|salt))\b|صابون|جل استحمام|غسول (جسم|الجسم)|ليف[ةه] استحمام")),
    ("personal", RX(r"\b(razor|razors|shaving (cream|gel|foam|brush|soap|machine)|after ?shave|shave gel|\bblades?\b|epilator|hair removal (cream|wax|spray)|depilat|wax(ing)? (strips?|kit|roll|beans?|heater)|cold wax|sugar wax|halawa|white paste remover hair|threading|tweez)\b|شفرات|امواس حلاقة|كريم حلاقة|ازالة الشعر|حلاو[ةه] شمع|شمع ازال|ماكينة حلاقة|ماكينة")),
    ("personal", RX(r"\b(sanitary (pad|napkin|towel)|panty ?liner|panti ?liner|maternity pad|tampon|menstrual (cup|pad|disc)|always\b|kotex|nana pad|libress|period (pad|panties))\b|فوط صحية|فوط يومية")),
    ("personal", RX(r"\b(cotton (wool|balls?|buds?|pads?|roll|tips)|ear ?buds?|q[- ]?tips?|make ?up pads?|nail (file|clipper|clippers?|scissors?|cutter|care)|nail (kit|set)|manicure|pedicure|foot (file|scrubber)|pumice|callus (remover|file)|tweezers?|hair (comb|brush)|\bcomb\b|\bcombs\b|hair (band|clip|pin|tie|roller|accessor)|shower cap|bath (brush|glove)|body (brush|sponge)|loof(f)?ah?|\blufa\b|\bloofa\b)\b|قط[نن] طبي|اعواد قطن|قصاف[ةه]|مقص اظافر|مشط|فرشا[ةه] شعر|لوف[ةه]|بكر شعر")),
    ("personal", RX(r"\b(talc(um)?( powder)?|body powder|prickly heat powder|perfumed talc|hand (sanitizer|gel|wash|rub)|antibacterial gel|alcohol gel 70|wet wipes|facial tissue|tissues?\b|kleenex|toilet (paper|roll)|paper towel|kitchen towel)\b|بودر[ةه] تلك|معقم (يدين|لليدين)|مناديل مبلل[ةه]|مناديل ورقي[ةه]|جل معقم")),
    ("personal", RX(r"\b(nivea|dove|rexona|\blux\b|lifebuoy|palmolive|camay|\bfa\b|gillette|schick|\bbic\b|veet|silky cool|cool ?& ?cool|noxzema|vaseline (lip|petroleum|intensive|cocoa|essential|ice cool|blue seal)|arm ?& ?hammer|old spice|right ?guard)\b")),
    ("personal", RX(r"\b(reading glasses|contact lens (case|solution)|lens (solution|care)|multi ?purpose solution|blink contacts|renu\b|opti[- ]?free)\b")),
    ("personal", RX(r"\b(sun ?glass(es)?|eye ?glass|shades? uv)\b")),

    # ---------- MEDICAL DEVICES ----------
    ("devices", RX(r"\b(glucomet(er|re)|glucose meter|blood glucose (meter|monitor|strips?)|blood sugar (meter|device)|(blood glucose |test |diabetic )strips?|\d+ test strips?\b|lancet(s|ing (device|pen))?)\b|جهاز سكر|شرائط سكر|شرايط سكر|جهاز قياس السكر|شرائط قياس")),
    ("devices", RX(r"\b(accu[- ]?chek|accu chek|contour (plus|ts|xt|next)|onetouch|one touch|bionime|fine ?test|on ?call|gluco(dr|smart|leader|lab|check)|freestyle|caresens|sd codefree|element (meter|strips))\b")),
    ("devices", RX(r"\b(blood pressure (monitor|apparatus|machine|device)|\bbp (monitor|apparatus|machine)|sphygmomanometer|digital (thermometer|bp)|thermometer|thermometre|infrared thermometer|forehead thermometer|pulse ox(imeter)?|oximeter|(jet|compressor|mesh|portable|piston) nebuli[sz]er|nebuli[sz]er (machine|device|kit)|steam inhaler|vaporizer machine|spacer (device|chamber)|aerochamber|peak flow meter)\b|جهاز ضغط|جهاز الضغط|ترمومتر|ترموميتر|جهاز بخار|نبولايزر|جهاز تنفس|جهاز قياس الضغط")),
    ("devices", RX(r"\b(weighing scale|body scale|bathroom scale|body fat scale|digital scale|hearing aid|\btens\b (unit|device|machine)|electric massager|massage (gun|machine|chair|belt)|hot water (bottle|bag)|ice (bag|cap)|heating pad|electric (heating|blanket)|cervical (collar|pillow)|lumbar support|knee (support|brace|cap|sleeve)|ankle (support|brace)|wrist (support|splint|brace)|elbow (support|brace)|back support belt|posture corrector|abdominal binder|rib belt|arm sling|shoulder (support|immobili)|orthopedic (insole|belt|shoe)|walking (stick|frame|aid)|walker|crutch(es)?|wheelchair|commode (chair)?|bed ?pan|air (mattress|cushion|ring)|donut cushion|anti[- ]?bed ?sore)\b|ميزان (طبي|رقمي)|سماع[ةه] طبي[ةه]|قرب[ةه] ماء|كمادة (ماء|جل)|دعام[ةه]|حزام (ظهر|رقب[ةه]|بطن)|عكاز|كرسي متحرك|مشاي[ةه] طبي[ةه]")),
    ("devices", RX(r"\b(pill (box|organi[sz]er|cutter|dispenser)|otoscope|stethoscope|magnifying glass|reflex hammer|penlight|tuning fork)\b")),
    ("devices", RX(r"\b(beurer|omron|microlife|rossmax|\bhartmann\b .* (monitor|thermometer)|citizen (thermometer|scale)|dr ?trust|yuwell)\b")),

    # ---------- FIRST AID & MEDICAL SUPPLIES ----------
    ("firstaid", RX(r"\b(gauze|paraffin gauze|cotton gauze|bandage|crepe bandage|elastic bandage|conforming bandage|triangular bandage|adhesive (bandage|plaster|tape|dressing)|band[- ]?aid|\bplaster\b|surgical tape|micropore|transpore|paper tape|wound (dressing|closure|pad|care)|island dressing|foam dressing|hydrocolloid|alginate dressing|burn (dressing|gel|cream|pad)|scar (gel|sheet)|steri[- ]?strip|derma ?pore|tubular (bandage|gauze)|cohesive bandage|kinesio(logy)? tape|\bcast\b .* (fiberglass|plaster)|fiberglass cast|airoplast|airoplaste|zinc oxide (plaster|tape))\b|شاش|شاش طبي|ضماد|ضماد[ةه]|بلاستر|لزق[ةه] جروح|غيار جروح|رباط ضاغط|جبير[ةه]")),
    ("firstaid", RX(r"\b(syringe|syringes|insulin syringe|needle(s)?\b|hypodermic|iv (cannula|catheter|set|line)|cannula|canula|infusion set|scalp vein|butterfly needle|three way|3[- ]?way (stopcock|tap)|extension (set|tube)|nasogastric|ryle'?s tube|foley|catheter|urin(e|ary) (bag|collector|catheter)|leg bag|colostomy|ostomy|drainage bag|suction catheter|feeding tube)\b|سرنج[ةه]|سرنجات|ابر[ةه]|كانيولا|قسطر[ةه]|كيس بول|مغذي|محلول وريدي")),
    ("firstaid", RX(r"\b(face ?mask|surgical mask|medical mask|\bn[- ]?95\b|\bkn[- ]?95\b|ffp2|respirator mask|3 ?ply mask|nose mask|examination gloves?|latex gloves?|nitrile gloves?|surgical gloves?|sterile gloves?|vinyl gloves?|disposable gloves?|shoe cover|surgical (cap|gown)|isolation gown|face shield|apron disposable|bouffant cap)\b|كمام[ةه]|كمامات|ماسك طبي|قفازات|جوانتي|جوانتيات")),
    ("firstaid", RX(r"\b(antiseptic|disinfectant|surgical spirit|isopropyl alcohol|ethyl alcohol|rubbing alcohol|alcohol (swab|pad|70|90|solution|prep)|hydrogen peroxide|betadine|povidone[- ]?iodine|\bdettol\b(?!.* soap)|savlon|chlorhexidine|hibiscrub|hibitane|cetrimide|instrument (disinfect|sterili)|hand ?rub sanitiz)\b|مطهر|كحول طبي|سبيرتو|مي[ةه] اكسجين|بيتادين|مطهر جروح")),
    ("firstaid", RX(r"\b(first aid (kit|box|bag)|emergency kit|instant (ice|cold) pack|cold pack|thermal blanket|tourniquet|splint|arm splint|finger splint|eye (pad|patch|shield)|eye (wash|bath)|ear (syringe|bulb|wax removal kit)|enema (kit)?|rectal syringe|glycerin enema)\b|شنط[ةه] اسعافات|اسعافات اولي[ةه]")),
    ("firstaid", RX(r"\bcotton\b.{0,20}\b(roll|\d+ ?gm?|zig ?zag|surgical|absorbent|medical|w\.?w)\b|قطن طبي")),
    ("firstaid", RX(r"\binfusion set|blood (set|administration)|urine (bag|beg)|drip set\b")),

    # ---------- VITAMINS & SUPPLEMENTS ----------
    ("vitamins", RX(r"\b(multivitamin|multi[- ]?mineral|vitamin b[- ]?complex|folic acid|folate|omega[- ]?3|omega 3[- ]?6[- ]?9|fish oil|cod liver oil|evening primrose|flaxseed oil|krill oil)\b")),
    ("vitamins", RX(r"\b(collagen( peptide| powder| drink| advance)?|marine collagen|acti[- ]?colla|biotin|glucosamine|chondroitin|\bmsm\b|coenzyme q10|co[- ]?q10|ubiquinol|l[- ]?carnitine|l[- ]?arginine|creatine|\bbcaa\b|whey protein|mass gainer|weight gainer|meal replacement|protein powder|amino ?leban|hi[- ]?potency formula)\b")),
    ("vitamins", RX(r"\b(probiotic|prebiotic|lactobacillus|synbiotic|milk thistle|silymarin|ginkgo( biloba)?|\bginko\b|ginseng|panax|ashwagandha|rhodiola|turmeric|curcumin|spirulina|chlorella|moringa|royal jelly|propolis|bee pollen|melatonin|valerian|5[- ]?htp|saw palmetto|palmetto|cranberry (extract|capsule)|black seed( oil)?|nigella|resveratrol|quercetin|glutathione|alpha lipoic|artichoke|soy isoflav|artisoy|belegan|troya)\b")),
    ("vitamins", RX(r"\b(immune (support|booster)|hair skin (and|&) nails|hair (skin nails|growth) (vitamin|supplement|tablet)|prenatal (vitamin|supplement)|pregnancy (vitamin|supplement)|kids? (vitamin|multivitamin|omega|gummies)|vitamin gummies|gummies (vitamin|multivit)|iron (supplement|tonic)|calcium (\+ ?d3|citrate|supplement))\b")),
    ("vitamins", RX(r"\b(now foods|puritan'?s? pride|puritan|solgar|natrol|21st century|nature'?s bounty|jamieson|\bgnc\b|california gold|doctor'?s best|nordic naturals|swanson|mason natural|haliborange|abidec|vidaylin|immunace|wellman|wellwoman|centrum|pharmaton|supradyn|berocca|elevit|surbex|revital|imedeen|perfectil|seven seas|sanatogen)\b")),
    ("vitamins", RX(r"مكمل غذائي|فيتامينات|كولاجين|اوميجا 3|زيت السمك|زيت كبد الحوت")),
    ("vitamins", RX(r"\b(slimming|weight loss|fat burner|green (tea|coffee) extract|garcinia|\bcla\b|detox tea|colon cleanse|appetite (control|suppress)|meal shake|carb blocker)\b")),

    # ---------- DIGESTIVE (OTC gut) ----------
    ("digestive", RX(r"\b(antacid|acid reflux|heartburn|gaviscon|maalox|mucogel|epimag|\beno\b|andrews (salt|liver)|rennie|\btums\b|disflatyl|infacol|simethicone|gas relief|anti[- ]?flatulent|activated charcoal (tab|cap))\b")),
    ("digestive", RX(r"\b(laxative|constipation (relief|syrup)|lactulose|duphalac|milk of magnesia|senna(lax)?|dulcolax|glycerin supp|glycerine supp|microlax|fleet enema|movicol|forlax|agiolax|fybogel|psyllium husk|isphagula|abbucol)\b")),
    ("digestive", RX(r"\b(oral rehydration|rehydration salts?|\bors\b|electrolyte (sachet|powder|solution|drink)|alexolyte|pedialyte|anti[- ]?diarr(hea|hoea)l?|diarrhea relief|imodium|kaopectate|lacteol|ultra[- ]?levure|entero(germina|zith))\b")),
    ("digestive", RX(r"\b(gripe water|colic (drops|aid|calm)|baby calm|peppermint oil capsule|colpermin|iberogast|digestive enzyme|lactase (enzyme|drops)|festal|creon otc)\b")),
    ("digestive", RX(r"فوار\b|فوار (معد[ةه]|هضم)|املاح شرب|محلول معالج[ةه] الجفاف|ملين|شراب ملين|مضاد اسهال|حموض[ةه]")),

    # ---------- COLD, COUGH & ALLERGY (OTC) ----------
    ("cold", RX(r"\b(cough (syrup|drops|lozenge|sedative|expectorant|relief|mixture|linctus)|dry cough|chesty cough|expectorant|mucolytic (syrup|sachet)|bromhexine (syrup|elixir)|guaifenesin syrup|carbocisteine|ambroxol (syrup|drops)|prospan|bronchicum|balsam sedative|tussi)\b")),
    ("cold", RX(r"\b(cold (\+ ?flu|and flu|relief)|flu relief|flu ?away|day ?& ?night cold|decongestant|blocked nose|nasal congestion|catarrh|comtrex|congestal|coldflam|codocumol|frenadol|theraflu|coldact|rhino[- ]?clear|sinus relief|sinutab|fluimucil)\b")),
    ("cold", RX(r"\b(nasal (spray|drops|rinse|wash|aspirator|gel)|saline (spray|drops|nasal|nose)|sea water (nasal|spray|nose)|xylometazoline|otrivin|sinomarin|sterimar|physiomer|nasivin|afrin|marimer|humer|rhinocort otc|baby nadif nasal)\b|بخاخ انف|نقط انف|محلول ملحي للانف|ماء البحر للانف|سبراي انف")),
    ("cold", RX(r"\b(sore throat|throat (spray|lozenge|pastille|gargle|relief)|\blozenge|pastille|strepsils|difflam|tantum verde|hexoral|o* ?septol|throaties|honey ?& ?lemon)\b|لبان دكر|بخاخ زور|اقراص استحلاب|التهاب الحلق")),
    ("cold", RX(r"\b(antihistamine|allergy relief|hay ?fever|loratadine (syrup|otc)|cetirizine (syrup|drops|otc)|fexofenadine otc|claritine|zyrtec|anti[- ]?allergic|desloratadine otc|allergex)\b")),
    ("cold", RX(r"\b(vicks|vapou?rub|vapo ?rub|inhaler stick|nasal inhaler|menthol rub|chest rub|karvol|olbas oil|eucalyptus (oil|rub|inhal))\b|فيكس")),
    ("cold", RX(r"كح[ةه]\b|شراب كح[ةه]|طارد للبلغم|زكام|رشح|احتقان الانف|نزلات البرد")),

    # ---------- PAIN & FEVER (OTC) ----------
    ("pain", RX(r"\b(paracetamol|acetaminophen|panadol|abimol|cetal|\badol\b|revamol|paramol|xpandol|fevadol|tylenol|calpol|dolprimol|dolo\b|pa+mol)\b(?!.{0,12}\b(iv|infusion|vial)\b)")),
    ("pain", RX(r"\b(ibuprofen|brufen|profen(al)?|nurofen|advil|dolphin|megafen|rapidus|cataflam|diclo(fenac)? (gel|sr|potassium|emulgel)|voltaren (emulgel|gel|rapid|dolo)|olfen gel|dolfenac gel|feldene gel|reparil (gel|ice)|thrombophob|hirudoid|deep heat|deep freeze|fastum gel|counterpain|algesal|movirab|oust gel|re138|aroma+ gel)\b")),
    ("pain", RX(r"\b(aspirin( protect| cardio)?|aspocid|aspicarlo|aspricarlo|disprin|alka[- ]?seltzer|ketoprofen gel|naproxen otc|mefenamic otc|ponstan otc|migraine (relief|support)|amigraine|headache relief|period pain|menstrual (cramp|pain)|joint (pain|rub|support gel)|muscle (pain|rub|relax)|back pain (gel|patch)|pain (relief patch|patch|balm)|heat patch|cooling patch|pain killer|analgesic balm)\b")),
    ("pain", RX(r"\bmassage (gel|cream|oil|spray|balm)\b|مساج|مساچ")),
    ("pain", RX(r"مسكن\b|مسكن للالم|خافض (حرار[ةه]|للحرار[ةه])|صداع|الم (العضلات|المفاصل|الظهر)|مرهم للالم|لزق[ةه] مسكن")),

    # ---------- HOME / GENERAL RETAIL ----------
    ("home", RX(r"\b(batter(y|ies)|button cell|cr ?20\d\d|lr\d\d|lighter|matches|candle|air freshener|room spray|insect(icide)? (spray|killer)|mosquito (repellent|coil|patch|mat|liquid)|fly (spray|paper|killer)|mothball|naphthalene|shoe (polish|shine|freshener)|super ?glue|adhesive glue|stationery|note ?book|marker pen|permanent marker|green river (mouse|rat|glue)|rat (glue|trap|poison)|mouse trap)\b")),
    ("home", RX(r"\b(dish ?wash(ing)?|laundry (detergent|liquid|powder)|fabric softener|bleach\b|clorox|floor cleaner|glass cleaner|multi[- ]?surface (cleaner|spray)|kitchen roll|garbage bags?|trash bags?|zip ?lock|cling film|alumin(i)?um foil|foil roll|paper (cups?|plates?)|drinking straws?|scouring pad|dish sponge)\b")),
    ("home", RX(r"\b(chocolate bar|candy\b|chewing gum(?!.* nicotine)|biscuit|wafer|potato chips|energy drink|soft drink|coffee sachet|instant coffee|\btea bags?\b|sugar sachet)\b")),
    ("home", RX(r"\b(phone (charger|cable|holder)|usb (cable|charger)|power ?bank|ear ?phone|umbrella|toy\b|toys\b|balloon|gift (bag|wrap|box)|greeting card|photo frame|water bottle sport|thermal flask|thermos)\b")),
]


TOPICAL_FORM = RX(
    r"\b(cream|creme|kream|ointment|oint\b|gel|emulgel|lotion|foam(?! bath)|paste|drops?|solution|susp(ension)?|"
    r"suppositor(y|ies)|supp\b|supps\b|pessar(y|ies)|spray|inhaler|nebule|nebules|respule|ampoule?s?|amp\b|amps\b|"
    r"vial|vials|syrup|syp\b|elixir|sachet|sachets|effervescent|\beff\b|serum eye|nasal|eye|ear|shampoo medicated|"
    r"tab(let)?s?\b|cap(sule)?s?\b|\bf\.?c\.?\s?tabs?\b|\bs\.?r\.?\s?tabs?\b|\be\.?c\.?\s?tabs?\b|chewable|"
    r"\d+\s?(mg|mcg|iu|i\.u|gm|g|ml|%)\b)\b"
)


def classify(rec):
    n = rec["name"]
    for cat, rx in RULES:
        if rx.search(n):
            return cat
    if TOPICAL_FORM.search(n):
        return "medicine"
    # unknown -> most inventory in a pharmacy is medicine; default there
    return "medicine"


# --------------------------------------------------------------------------
# 3. HAIR-COLOUR SHADE  ->  swatch colour
#    International Colour Chart: leading number = lightness level 1(black)
#    ..10(lightest blonde); digits after the . or - = tone/reflect.
# --------------------------------------------------------------------------
LEVEL_HEX = {
    1: "#100b0a", 2: "#1c1310", 3: "#2e1e17", 4: "#42291d", 5: "#5c3b26",
    6: "#7a5233", 7: "#9c7245", 8: "#bd9760", 9: "#d9bd8b", 10: "#ecdcb8",
}
# tone shift applied to the level colour (very rough, just enough to read)
TONE_SHIFT = {
    "0": (0, 0, 0), "1": (-14, -6, 4), "2": (-6, -12, 10), "3": (18, 10, -18),
    "4": (30, 2, -22), "5": (34, -10, -16), "6": (40, -18, -18), "7": (6, -4, -10),
    "8": (2, -2, 6), "9": (-4, -14, 16),
}
# Bigen has its own shade numbering (not the international chart)
BIGEN_HEX = {
    "20": "#15161f", "37": "#4a2a1c", "46": "#5a3620", "47": "#5b1a22", "48": "#3a2519",
    "56": "#4f3221", "57": "#33200f", "58": "#0d0a09", "59": "#0d0a09", "76": "#4a2a1c",
    "77": "#5b1a22", "88": "#1c1310", "106": "#12100f",
}
COLOR_WORD_HEX = [
    (r"\b(jet |ebony |natural )?black\b|اسود\b|أسود", "#0d0a09"),
    (r"blue ?black|اسود مزرق|أسود مزرق", "#15161f"),
    (r"\bdarkest brown|very dark brown", "#2a1a12"),
    (r"\bdark(est)? brown\b|بني غامق|بني احمر غامق|بنى غامق", "#33200f"),
    (r"\bchocolate|شوكولا|شوكولاته|شيكولاته", "#3b241a"),
    (r"\bchestnut|كستنائي|كستناء", "#4a2a1c"),
    (r"\bcoffee|espresso|قهو[ةه]", "#3a2519"),
    (r"\bmocca|mocha|موكا", "#4b3120"),
    (r"\bburgundy|mahogany|\bplum\b|مخملي|نبيتي|احمر مخملي|بنى مخملى", "#5b1a22"),
    (r"\b(copper|ginger|cinnamon)\b|نحاسي", "#8a4324"),
    (r"\b(red|auburn)\b|احمر\b|أحمر", "#7a2b1e"),
    (r"\bmedium brown\b|بني متوسط|بنى متوسط", "#4f3221"),
    (r"\b(light|golden) brown\b|بني فاتح|بنى فاتح|بني فاتح ذهبي", "#6b4428"),
    (r"\bbrown\b|بني\b|بنى\b", "#452a1a"),
    (r"\bdark(est)? blond(e)?\b|اشقر غامق|أشقر غامق", "#7d5a34"),
    (r"\b(toffee|honey|caramel) blond|toffee blonde|honey blonde|عسلي", "#a9793f"),
    (r"\b(ash|silver|smoky|smokey) blond|اشقر رمادي|رمادي|فضى|فضي|رمادى", "#9a8b73"),
    (r"\bmedium blond(e)?\b|اشقر متوسط|أشقر متوسط", "#b48b55"),
    (r"\b(light|iced|pearl|beige) blond(e)?\b|\bbeige\b|اشقر فاتح|أشقر فاتح|بيج", "#d8bd8b"),
    (r"\b(ultra|extra|super) light .*blond|اشقر فاتح جدا|اشقر فاتح فائق|بلاتيني|platinum", "#e6d4ab"),
    (r"\bblond(e)?\b|اشقر\b|أشقر", "#c39a63"),
    (r"\bviolet|purple|بنفسجي", "#4a3550"),
    (r"\bhenna\b|حن[هة]|حناء", "#5b3a1e"),
    (r"\byouthair\b|colou?r restoring|progressive", "#33200f"),
]


def _clamp(x):
    return max(0, min(255, int(round(x))))


def _mix(hexstr, shift):
    r = int(hexstr[1:3], 16) + shift[0]
    g = int(hexstr[3:5], 16) + shift[1]
    b = int(hexstr[5:7], 16) + shift[2]
    return "#%02x%02x%02x" % (_clamp(r), _clamp(g), _clamp(b))


def hair_shade(name):
    """Return (shade_label, swatch_hex) or (None, None)."""
    up = name.upper()
    level = tone = None
    label = None

    # Bigen's own numbering
    mb = re.search(r"\bBIGEN\b.*?(\d{2,3})\b", up)
    if mb and mb.group(1) in BIGEN_HEX:
        return mb.group(1), BIGEN_HEX[mb.group(1)]

    # explicit international shade code:  8-0 / 5.68 / 7.11 / 5/3 / 10-46
    m = re.search(r"(?<![\d.])([1-9]|10)\s*([.\-/])\s*(\d{1,2})(?![\d])", name)
    if m:
        level = int(m.group(1))
        tone = m.group(3)
        label = f"{m.group(1)}{m.group(2)}{tone}".replace("/", ".")
    else:
        m2 = re.search(r"\b(?:COLOU?R|CREME|CREAM|EXCELLENCE|NATURALS?|HAIR)\s+(?:CREME\s+|CREAM\s+|HAIR\s+|COLOR\s+)?(?:LIGHT BEIGE\s+|BLACK\s+|BROWN\s+|BLOND(?:E)?\s+)?([1-9]|10)\b(?![.\-/]\d)", up)
        m3 = re.search(r"\bCASTING(?: COLOR)?\D{0,16}\b(\d)(\d\d)\b", up)  # 3-digit Casting
        if m3:
            level = int(m3.group(1))
            tone = m3.group(2)[0]
            label = f"{m3.group(1)}{m3.group(2)}"
        elif m2:
            level = int(m2.group(1))
            tone = "0"
            label = m2.group(1)
    # colour word (also used as the visible label when present)
    word_hex = None
    for pat, hx in COLOR_WORD_HEX:
        if re.search(pat, name, re.I):
            word_hex = hx
            break
    if level is not None:
        base = LEVEL_HEX.get(level, "#6b4a2e")
        sh = TONE_SHIFT.get(tone[0] if tone else "0", (0, 0, 0))
        hx = _mix(base, sh)
        # if we also matched a strong colour word, average the two for realism
        if word_hex:
            hx = _mix(hx, (
                (int(word_hex[1:3], 16) - int(hx[1:3], 16)) // 2,
                (int(word_hex[3:5], 16) - int(hx[3:5], 16)) // 2,
                (int(word_hex[5:7], 16) - int(hx[5:7], 16)) // 2,
            ))
        return label, hx
    if word_hex:
        return label, word_hex
    return None, None


# --------------------------------------------------------------------------
# 4. NAME CLEAN-UP  +  flags
# --------------------------------------------------------------------------
# detection of "is this an offer line" — broad
OFFER_PAT = RX(r"(\boffer\b|\bspecial offer\b|\d+\s*%\s*(off|offer)|%\s*\d+|off\s*\d+\s*(l\.?e|le|egp)|"
               r"خصم|عرض|\d+%\s*خصم|buy\s*1\s*get\s*(one|1)|1\s*buy\s*get\s*1|\bb1g1\b|\bbogo\b|"
               r"\d\s*\.?\s*buy\s*\.?\s*1\s*free|1\s*\+\s*1\s*free|\bget\s*(one|1)\s*(free|50%))")
# Stripped from the display name (offer/marketing noise).
#
# A percentage is ONLY noise when it sits next to a discount word. A bare
# "0.05%" / "0.1%" / "5%" is the strength of a medicine, not a discount —
# stripping those turned "ACANTHAPROP 0.1% EYE DROP" into "ACANTHAPROP 0.
# EYE DROP" across 58 products, destroying safety-critical dosage info. So
# every percent rule below requires خصم / OFFER / OFF adjacent to it.
NOISE_PAT = RX(r"(\bnew\s*price(s)?\b\s*\d*|\bnew\s*\d\b|\bspecial offer\b|\boffer\b|"
               r"\d+\s*%\s*(offer|off)\b|\b(off|offer)\s*\d+\s*%|"
               r"\d+\s*%\s*خصم|خصم\s*\d*\s*%?|%\s*\d+\s*خصم|عرض|"
               r"\boff\s*\d+\s*(l\.?e|le|egp)|"
               r"buy\s*1\s*get\s*(one|1)( 50%| free)?|"
               r"1\s*buy\s*get\s*1|\bb1g1\b|\bbogo\b|1\s*\+\s*1( free)?|\bU\.?K\b)")
AR_CHARS = RX(r"[؀-ۿ]")
LATIN = RX(r"[A-Za-z]")
SHADE_TOK = RX(r"(?<![\d.])(?:[1-9]|10)[.\-/]\d{1,2}(?![\d])")


def clean_name(name):
    s = name
    s = re.sub(r"\.{3,}", " ", s)                       # "...." noise
    s = re.sub(r"\s*\.\s*$", "", s)
    # protect hair-colour shade codes (e.g. 10-46) from the % / digit noise rules
    holds = {}
    def _hold(mm):
        k = f"\x00{len(holds)}\x00"
        holds[k] = mm.group(0)
        return k
    s = SHADE_TOK.sub(_hold, s)
    s = NOISE_PAT.sub(" ", s)
    # NOTE: a trailing "COD 137" / "CODE.0293" is deliberately NOT stripped.
    # It looks like barcode noise but it is the variant code — the only thing
    # telling 93 different YOLO nail-polish colours apart, or four different
    # A.Y hair combs. Removing it made them all display as the same product,
    # so a customer could not tell which shade they were ordering, and the
    # pharmacy could not tell which one was meant on the WhatsApp order.
    for k, v in holds.items():
        s = s.replace(k, v)
    # orphaned percent sign — but NOT one that belongs to a number ("5 %
    # 10 GM" is a 5% cream), which is why this requires no digit before it
    s = re.sub(r"(?<![\d\s])\s+%\s*", " ", s)
    s = re.sub(r"(\d)\s+%", r"\1%", s)                              # "5 %" -> "5%"
    s = re.sub(r"(\b(?:[1-9]|10)[-.]\d{1,2})\s+\d{1,2}\b\s*$", r"\1", s)  # "7-17 20" -> "7-17"
    s = re.sub(r"\s{2,}", " ", s).strip(" .-–,%")
    s = re.sub(r"\s+", " ", s)
    return s or name.strip()


def split_langs(cleaned, original):
    """Return (en, ar, arabic_only)."""
    has_ar = bool(AR_CHARS.search(cleaned))
    has_latin = bool(LATIN.search(cleaned))
    if has_latin and has_ar:
        # keep the latin part as EN, whole cleaned string as AR
        en = re.sub(r"[؀-ۿ]+", " ", cleaned)
        en = re.sub(r"\s{2,}", " ", en).strip(" .-–,")
        return en, cleaned, False
    if has_latin:
        return cleaned, cleaned, False
    # arabic only
    return cleaned, cleaned, True


RX_FLAG = RX(
    r"\b(augmentin|hibiotic|curam|megamox|clavimox|unictam|ampiclox|zithromax|zisrocin|klacid|azrolid|cipro|"
    r"ciprocin|floxacin|tavanic|avalox|zinnat|ceftriaxone|cefotax|rocephin|tazocin|meronem|tienam|vancomycin|"
    r"gentamicin|amikacin inj|clindamycin|dalacin|flagyl|amrizole|doxycycline|vibramycin|tetracycline|"
    r"insulin|lantus|levemir|toujeo|novomix|novorapid|humalog|humulin|mixtard|apidra|actrapid|insulatard|"
    r"tresiba|ryzodeg|xultophy|victoza|ozempic|trulicity|saxenda|"
    r"warfarin|marevan|plavix|clopidogrel|xarelto|eliquis|pradaxa|heparin|clexane|"
    r"tramadol|tramal|contramal|morphine|fentanyl|oxycodone|codeine phosphate|pethidine|"
    r"tegretol|epanutin|keppra|depakine|lamictal|rivotril|prozac|cipralex|seroxat|zoloft|"
    r"lexotanil|xanax|valium|tranxene|risperdal|seroquel|zyprexa|abilify|haldol|"
    r"prednisolone|hostacortin|solupred|deltacortril|methylprednisolone|dexamethasone amp|"
    r"methotrexate|humira|enbrel|remicade|mycofit|cellcept|imuran|tacrolimus|cyclosporine|"
    r"chemo|cytotoxic|tamoxifen|arimidex|femara|zoladex|casodex)\b"
)


def is_rx(name, cat):
    if RX_FLAG.search(name):
        return True
    return False


# --------------------------------------------------------------------------
# 5. MAIN
# --------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("xlsx", nargs="?", default="inventory.xlsx")
    ap.add_argument("--out", default="catalog.generated.js")
    ap.add_argument("--report", default="build_report.txt")
    ap.add_argument("--missing", default=None,
                    help="write flagged / ambiguous products here (JSON)")
    ap.add_argument("--dump-dir", default=None,
                    help="write per-category review dumps into this dir")
    a = ap.parse_args()

    recs = read_rows(a.xlsx)
    seen = set()
    products = []
    cat_count = Counter()
    flagged = []          # data-quality / ambiguous rows for manual review
    code_counts = Counter(r["code"] for r in recs)
    for rec in recs:
        raw_code = rec["code"] or "x"
        code = re.sub(r"[^A-Za-z0-9_-]", "", raw_code) or "x"
        base = code
        i = 2
        while code in seen:
            code = f"{base}-{i}"
            i += 1
        seen.add(code)

        cat = classify(rec)
        cat_count[cat] += 1
        cleaned = clean_name(rec["name"])
        en, ar, ar_only = split_langs(cleaned, rec["name"])
        offer = bool(OFFER_PAT.search(rec["name"]))
        rx = is_rx(rec["name"], cat)
        shade = swatch = None
        if cat == "haircolor":
            shade, swatch = hair_shade(rec["name"])

        price = rec["price"] or 0
        price = round(price, 2)
        if price == int(price):
            price = int(price)

        p = {
            "id": code,
            "code": rec["code"],
            "en": en[:90],
            "ar": ar[:90],
            "cat": cat,
            "price": price,
            "stock": (rec["qty"] or 0) > 0,
            "company": rec["company"],
            "unit": rec["unit"],
        }
        if rx:
            p["rx"] = True
        if ar_only:
            p["arabicOnly"] = True
        if offer:
            p["offer"] = True
        if shade:
            p["shade"] = shade
        if swatch:
            p["swatch"] = swatch
        products.append(p)

        # ---- data-quality flags (for manual review) ----
        reasons = []
        if len(re.sub(r"[^A-Za-z0-9؀-ۿ]", "", p["en"] + p["ar"])) < 3:
            reasons.append("name is punctuation/near-empty in the source sheet")
        if not rec["price"]:
            reasons.append("price missing or zero in the source sheet")
        if code_counts[raw_code] > 1:
            reasons.append(f"product code {raw_code} appears {code_counts[raw_code]}x in the sheet")
        if not raw_code.isdigit():
            reasons.append(f"non-standard product code '{raw_code}'")
        if reasons:
            flagged.append({
                "code": rec["code"], "id": code, "name": rec["name"],
                "category": cat, "reasons": reasons,
            })

    # ---- write JS ----
    header = (
        "// AUTO-GENERATED by scripts/build-catalog.py — DO NOT EDIT BY HAND.\n"
        "// Source: the pharmacy's inventory export (رصيد الأصناف فى جميع المخازن).\n"
        f"// {len(products)} items. Regenerate: python scripts/build-catalog.py <new-inventory.xlsx>\n"
        "export const generatedProducts = "
    )
    body = json.dumps(products, ensure_ascii=False, separators=(",", ":"))
    with io.open(a.out, "w", encoding="utf-8") as f:
        f.write(header + body + ";\n")

    # ---- report ----
    with io.open(a.report, "w", encoding="utf-8") as f:
        f.write(f"TOTAL {len(products)}\n\n")
        for c, n in cat_count.most_common():
            f.write(f"{n:6d}  {c}\n")
        f.write(f"\nrx-flagged: {sum(1 for p in products if p.get('rx'))}\n")
        f.write(f"offers:     {sum(1 for p in products if p.get('offer'))}\n")
        f.write(f"out of stock: {sum(1 for p in products if not p['stock'])}\n")
        f.write(f"arabic-only: {sum(1 for p in products if p.get('arabicOnly'))}\n")
        f.write(f"haircolor w/ swatch: {sum(1 for p in products if p.get('swatch'))} / {cat_count['haircolor']}\n")

    print(io.open(a.report, encoding="utf-8").read())

    # ---- missing / ambiguous products ----
    if a.missing:
        no_image = len(products)  # no authorised catalog image source is reachable yet
        payload = {
            "generated_from": os.path.basename(a.xlsx),
            "image_source": {
                "url": "https://instashop.com/en-eg/client/ahmed-maher-pharmacy-1st-dist-6th-of-october",
                "status": "not accessible for automated use",
                "detail": (
                    "instashop.com/robots.txt disallows /product/* and /search/* for all crawlers, "
                    "and the store page returns HTTP 403 to non-browser requests. Per the task's own "
                    "rule, automated acquisition was stopped rather than bypassed."
                ),
                "what_is_needed": (
                    "an authorised export of the InstaShop product images (the pharmacy can pull these "
                    "from their InstaShop merchant dashboard), OR a folder of photos keyed by product "
                    "code, OR written permission + API access from InstaShop. Once available, drop the "
                    "files into public/images/products/<code>.jpg and list their codes in "
                    "src/data/products.js (CODES_WITH_IMAGE)."
                ),
            },
            "counts": {
                "total_products": len(products),
                "with_image": 0,
                "without_image": no_image,
                "hair_colour_with_swatch": sum(1 for p in products if p.get("swatch")),
                "data_quality_flags": len(flagged),
            },
            "note": (
                "Every product currently renders a clean fallback (category illustration, or an "
                "accurate shade swatch for hair colour) — no product is shown a wrong image. The list "
                "below is only rows with a data problem in the source sheet that a human should look at."
            ),
            "flagged_products": flagged,
        }
        with io.open(a.missing, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        print(f"wrote {a.missing} ({len(flagged)} flagged rows)")

    # ---- optional per-category dumps for manual review ----
    if a.dump_dir:
        os.makedirs(a.dump_dir, exist_ok=True)
        by = defaultdict(list)
        for p in products:
            by[p["cat"]].append(p)
        for c, items in by.items():
            with io.open(os.path.join(a.dump_dir, f"{c}.txt"), "w", encoding="utf-8") as f:
                for p in items:
                    extra = " ".join(k for k in ("rx", "offer", "arabicOnly") if p.get(k))
                    f.write(f"{p['id']:>9} | {str(p['price']):>7} | {p.get('shade') or '':>7} "
                            f"{p.get('swatch') or '':>8} | {extra:14} | {p['en'][:60]}\n")


if __name__ == "__main__":
    main()
