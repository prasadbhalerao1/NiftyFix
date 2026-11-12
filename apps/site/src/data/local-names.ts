/**
 * What people call each tool in Hindi and Marathi, and how they type it in
 * Latin letters (Hinglish, Marathi in English). Added to the tool page's
 * structured data (not shown, to keep pages clean) and matched by the site search.
 */
export interface LocalNames {
  hi: string;
  mr: string;
  /** Hinglish and Marathi typed in English letters. */
  latin: readonly string[];
}

export const LOCAL_NAMES: Record<string, LocalNames> = {
  'calculators.emi-calculator': {
    hi: 'ईएमआई कैलकुलेटर, लोन की किस्त निकालें',
    mr: 'ईएमआय कॅल्क्युलेटर, कर्जाचा हप्ता काढा',
    latin: [
      'loan ki kist kaise nikale',
      'emi kitni banegi',
      'home loan emi nikalo',
      'karjacha hapta',
    ],
  },
  'calculators.gst-calculator': {
    hi: 'जीएसटी कैलकुलेटर, जीएसटी जोड़ें या हटाएं',
    mr: 'जीएसटी कॅल्क्युलेटर, जीएसटी जोडा किंवा काढा',
    latin: ['gst kaise nikale', 'gst jodna', 'gst hatana', 'gst kiti lagel'],
  },
  'forms.passport-photo-maker': {
    hi: 'पासपोर्ट साइज़ फोटो बनाएं',
    mr: 'पासपोर्ट साईज फोटो बनवा',
    latin: ['passport size photo kaise banaye', 'passport photo banao', 'passport photo banva'],
  },
  'forms.photo-resizer': {
    hi: 'फॉर्म के लिए फोटो का साइज़ और KB कम करें',
    mr: 'फॉर्मसाठी फोटोचा साईज आणि KB कमी करा',
    latin: ['photo ka size kam kare', 'photo 50kb me kaise kare', 'photo chi size kami kara'],
  },
  'forms.photo-sheet-maker': {
    hi: 'एक पेज पर कई पासपोर्ट फोटो प्रिंट करें',
    mr: 'एका पानावर अनेक पासपोर्ट फोटो प्रिंट करा',
    latin: ['ek page par 8 photo', 'passport photo print sheet', 'photo sheet banao'],
  },
  'forms.signature-resizer': {
    hi: 'फॉर्म के लिए सिग्नेचर का साइज़ कम करें',
    mr: 'फॉर्मसाठी सहीचा साईज कमी करा',
    latin: ['signature ka size kam kare', 'signature 20kb me', 'sahi chi size kami kara'],
  },
  'image.compress-image': {
    hi: 'फोटो का साइज़ कम करें (KB कम करें)',
    mr: 'फोटोचा साईज कमी करा (KB कमी करा)',
    latin: ['photo ka size kaise kam kare', 'image kb kam kare', 'photo chi size kami kara'],
  },
  'image.convert-image': {
    hi: 'फोटो का फॉर्मेट बदलें (JPG, PNG, WebP)',
    mr: 'फोटोचा फॉरमॅट बदला (JPG, PNG, WebP)',
    latin: ['png ko jpg kaise kare', 'photo format badle', 'jpg madhe badla'],
  },
  'pdf.pages-per-sheet': {
    hi: 'एक पेज पर कई PDF पेज, बुकलेट',
    mr: 'एका पानावर अनेक PDF पाने, पुस्तिका',
    latin: ['ek page par 4 page print', 'notes print kam paper me', 'pdf booklet kaise banaye'],
  },
  'image.blur-image': {
    hi: 'फोटो का हिस्सा धुंधला करें या छिपाएं',
    mr: 'फोटोचा भाग धूसर करा किंवा लपवा',
    latin: ['photo blur kaise kare', 'aadhaar number kaise chupaye', 'photo madhla bhag lapva'],
  },
  'image.combine-images': {
    hi: 'फोटो जोड़ें, दो फोटो एक में',
    mr: 'फोटो जोडा, दोन फोटो एकत्र करा',
    latin: [
      'do photo ek me kaise kare',
      'photo jodna',
      'aadhar card aage peeche ek page',
      'photo jodne wala',
    ],
  },
  'image.favicon-generator': {
    hi: 'वेबसाइट का फेविकॉन (आइकन) बनाएं',
    mr: 'वेबसाइटचा फेविकॉन (आयकॉन) बनवा',
    latin: ['favicon kaise banaye', 'website icon kaise banaye', 'favicon banva'],
  },
  'image.image-color-picker': {
    hi: 'फोटो से रंग का कोड निकालें',
    mr: 'फोटोमधून रंगाचा कोड काढा',
    latin: ['photo se color code kaise nikale', 'image ka hex code', 'photo madhun rang code'],
  },
  'image.image-to-base64': {
    hi: 'फोटो को Base64 में बदलें',
    mr: 'फोटो Base64 मध्ये बदला',
    latin: ['image to base64 kaise kare', 'base64 se image banaye', 'photo base64 madhe'],
  },
  'image.make-square': {
    hi: 'फोटो चौकोर करें, बॉर्डर लगाएं',
    mr: 'फोटो चौकोनी करा, बॉर्डर लावा',
    latin: ['dp without crop', 'photo square kaise kare', 'photo me border lagana'],
  },
  'image.crop-image': {
    hi: 'फोटो क्रॉप करें, काटें',
    mr: 'फोटो क्रॉप करा, कापा',
    latin: ['photo crop kaise kare', 'photo katna', 'photo kapa'],
  },
  'image.remove-exif': {
    hi: 'फोटो से लोकेशन और जानकारी हटाएं',
    mr: 'फोटोमधून लोकेशन आणि माहिती काढा',
    latin: ['photo se location hataye', 'photo ki details hatao', 'photo madhun location kadha'],
  },
  'image.resize-image': {
    hi: 'फोटो की लंबाई-चौड़ाई बदलें',
    mr: 'फोटोची लांबी-रुंदी बदला',
    latin: ['photo resize kaise kare', 'photo chhota bada kare', 'photo resize kara'],
  },
  'image.rotate-image': {
    hi: 'फोटो घुमाएं या सीधा करें',
    mr: 'फोटो फिरवा किंवा सरळ करा',
    latin: ['photo ulta ho gaya', 'photo ghumaye', 'photo phirva'],
  },
  'image.split-image': {
    hi: 'फोटो को कई हिस्सों में काटें (ग्रिड)',
    mr: 'फोटोचे अनेक भाग करा (ग्रिड)',
    latin: ['photo ke tukde kaise kare', 'instagram grid kaise banaye', 'photo che bhag kara'],
  },
  'image.watermark-image': {
    hi: 'फोटो पर वॉटरमार्क या नाम लगाएं',
    mr: 'फोटोवर वॉटरमार्क किंवा नाव लावा',
    latin: ['photo par naam likhe', 'watermark kaise lagaye', 'photo var naav lava'],
  },
  'ocr.image-to-text': {
    hi: 'फोटो से टेक्स्ट निकालें (हिंदी, मराठी, अंग्रेज़ी)',
    mr: 'फोटोमधून मजकूर काढा (मराठी, हिंदी, इंग्रजी)',
    latin: ['photo se text nikale', 'image se hindi text', 'photo madhun text kadha'],
  },
  'pdf.add-page-numbers': {
    hi: 'पीडीएफ में पेज नंबर डालें',
    mr: 'पीडीएफमध्ये पान क्रमांक टाका',
    latin: ['pdf me page number kaise dale', 'pdf la page number taka'],
  },
  'pdf.compress-pdf': {
    hi: 'पीडीएफ का साइज़ कम करें',
    mr: 'पीडीएफचा साईज कमी करा',
    latin: ['pdf ka size kaise kam kare', 'pdf 200kb me kaise kare', 'pdf chi size kami kara'],
  },
  'pdf.compare-pdf': {
    hi: 'दो पीडीएफ की तुलना करें, फर्क देखें',
    mr: 'दोन पीडीएफची तुलना करा, फरक पहा',
    latin: ['do pdf compare kaise kare', 'pdf me farak dekhe', 'pdf tulna kara'],
  },
  'pdf.crop-pdf': {
    hi: 'पीडीएफ पेज क्रॉप करें',
    mr: 'पीडीएफ पान क्रॉप करा',
    latin: ['pdf crop kaise kare', 'pdf kinare katna'],
  },
  'pdf.extract-pdf-pages': {
    hi: 'पीडीएफ से कुछ पेज अलग निकालें',
    mr: 'पीडीएफमधून काही पाने वेगळी काढा',
    latin: ['pdf se page nikale', 'pdf madhun pane kadha'],
  },
  'pdf.extract-pdf-images': {
    hi: 'पीडीएफ से फोटो और इमेज निकालें',
    mr: 'पीडीएफमधून फोटो आणि इमेज काढा',
    latin: ['pdf se image kaise nikale', 'pdf se photo nikalna', 'pdf madhun photo kadha'],
  },
  'pdf.fill-pdf-form': {
    hi: 'पीडीएफ फॉर्म भरें',
    mr: 'पीडीएफ फॉर्म भरा',
    latin: ['pdf form kaise bhare', 'pdf form bhara'],
  },
  'pdf.flatten-pdf': {
    hi: 'पीडीएफ फॉर्म को लॉक करें (फ्लैटन)',
    mr: 'पीडीएफ फॉर्म लॉक करा (फ्लॅटन)',
    latin: ['pdf flatten kaise kare', 'pdf edit na ho'],
  },
  'pdf.grayscale-pdf': {
    hi: 'पीडीएफ को ब्लैक एंड व्हाइट करें',
    mr: 'पीडीएफ ब्लॅक अँड व्हाइट करा',
    latin: [
      'pdf ko black and white kaise kare',
      'pdf black white karna',
      'pdf black and white kara',
    ],
  },
  'pdf.image-to-pdf': {
    hi: 'फोटो को पीडीएफ में बदलें',
    mr: 'फोटोची पीडीएफ बनवा',
    latin: ['photo ko pdf kaise banaye', 'jpg se pdf', 'photo chi pdf banva'],
  },
  'pdf.merge-pdf': {
    hi: 'कई पीडीएफ को एक में जोड़ें',
    mr: 'अनेक पीडीएफ एकत्र जोडा',
    latin: ['pdf jodna', 'do pdf ek kaise kare', 'pdf ekatra kara'],
  },
  'pdf.organize-pdf': {
    hi: 'पीडीएफ के पेज आगे-पीछे करें या हटाएं',
    mr: 'पीडीएफची पाने मागे-पुढे करा किंवा काढा',
    latin: ['pdf page delete kaise kare', 'pdf page order badle'],
  },
  'pdf.pdf-metadata': {
    hi: 'पीडीएफ की जानकारी (लेखक, टाइटल) बदलें',
    mr: 'पीडीएफची माहिती (लेखक, शीर्षक) बदला',
    latin: ['pdf author name badle', 'pdf title change'],
  },
  'pdf.pdf-to-image': {
    hi: 'पीडीएफ को फोटो (JPG) में बदलें',
    mr: 'पीडीएफचे फोटो (JPG) बनवा',
    latin: ['pdf ko jpg kaise kare', 'pdf se photo', 'pdf che photo banva'],
  },
  'pdf.pdf-to-text': {
    hi: 'पीडीएफ से टेक्स्ट कॉपी करें',
    mr: 'पीडीएफमधून मजकूर कॉपी करा',
    latin: ['pdf se text nikale', 'pdf madhun text kadha'],
  },
  'pdf.rotate-pdf': {
    hi: 'पीडीएफ पेज घुमाएं',
    mr: 'पीडीएफ पान फिरवा',
    latin: ['pdf ulta hai seedha kare', 'pdf rotate kaise kare', 'pdf phirva'],
  },
  'pdf.sign-pdf': {
    hi: 'पीडीएफ पर सिग्नेचर करें',
    mr: 'पीडीएफवर सही करा',
    latin: ['pdf par sign kaise kare', 'pdf var sahi kara'],
  },
  'pdf.split-pdf': {
    hi: 'पीडीएफ को अलग-अलग फाइलों में बांटें',
    mr: 'पीडीएफ वेगवेगळ्या फाईलमध्ये विभागा',
    latin: ['pdf alag kaise kare', 'pdf todna', 'pdf vegli kara'],
  },
  'pdf.unlock-pdf': {
    hi: 'पीडीएफ का पासवर्ड हटाएं',
    mr: 'पीडीएफचा पासवर्ड काढा',
    latin: ['pdf ka password kaise hataye', 'pdf password hatana', 'pdf password kadha'],
  },
  'pdf.watermark-pdf': {
    hi: 'पीडीएफ पर वॉटरमार्क लगाएं',
    mr: 'पीडीएफवर वॉटरमार्क लावा',
    latin: ['pdf par watermark kaise lagaye', 'pdf var watermark lava'],
  },
  'text.case-converter': {
    hi: 'अंग्रेज़ी टेक्स्ट को कैपिटल या छोटे अक्षरों में बदलें',
    mr: 'इंग्रजी मजकूर कॅपिटल किंवा लहान अक्षरात बदला',
    latin: ['capital letter kaise kare', 'small letter me badle'],
  },
  'text.krutidev-to-unicode': {
    hi: 'कृतिदेव से यूनिकोड और यूनिकोड से कृतिदेव कन्वर्टर',
    mr: 'कृतिदेव ते युनिकोड आणि युनिकोड ते कृतिदेव कन्व्हर्टर',
    latin: ['krutidev se unicode', 'unicode se krutidev', 'krutidev te unicode'],
  },
  'subtitles.convert-subtitles': {
    hi: 'सबटाइटल फाइल बदलें (SRT, VTT) और टाइमिंग ठीक करें',
    mr: 'सबटायटल फाइल बदला (SRT, VTT) आणि वेळ जुळवा',
    latin: ['srt ko vtt me kaise badle', 'subtitle sync kaise kare', 'subtitle time set kara'],
  },
  'text.sort-lines': {
    hi: 'लिस्ट को क्रम से लगाएं, दोहराई लाइनें हटाएं',
    mr: 'यादी क्रमाने लावा, पुन्हा आलेल्या ओळी काढा',
    latin: [
      'list ko alphabetical order me kaise kare',
      'duplicate line kaise hataye',
      'yadi kramane lava',
    ],
  },
  'text.text-repeater': {
    hi: 'टेक्स्ट या इमोजी को कई बार दोहराएं',
    mr: 'मजकूर किंवा इमोजी अनेक वेळा लिहा',
    latin: ['text repeater', 'ek message 100 baar kaise bheje', 'emoji repeat kara'],
  },
  'text.remove-line-breaks': {
    hi: 'टेक्स्ट से लाइन ब्रेक और फालतू स्पेस हटाएं',
    mr: 'मजकुरातील ओळ तुटणे आणि जादा जागा काढा',
    latin: [
      'pdf text copy karne par line toot jati hai',
      'extra space kaise hataye',
      'line break kadha',
    ],
  },
  'text.text-diff': {
    hi: 'दो टेक्स्ट की तुलना करें, फर्क देखें',
    mr: 'दोन मजकुरांची तुलना करा',
    latin: ['do text compare kaise kare', 'text me farak kaise dekhe', 'text tulna kara'],
  },
  'text.word-counter': {
    hi: 'शब्द गिनें (वर्ड काउंटर), हिंदी और अंग्रेज़ी',
    mr: 'शब्द मोजा (वर्ड काउंटर), मराठी आणि इंग्रजी',
    latin: ['shabd ginti', 'kitne shabd hai', 'shabd moja'],
  },
};

export const localNames = (id: string): LocalNames | undefined => LOCAL_NAMES[id];

/** Every local name and phrase, for the site search. */
export const localTerms = (id: string): string[] => {
  const names = LOCAL_NAMES[id];
  return names ? [names.hi, names.mr, ...names.latin] : [];
};
