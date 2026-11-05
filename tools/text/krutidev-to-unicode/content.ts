import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Kruti Dev 010 is still the font for Hindi typing tests in many courts and offices, and years of office files are typed in it. But Kruti Dev is not real Hindi text: it draws Hindi shapes on English keys, so copied into WhatsApp, email or a website, "भारत" turns into "Hkkjr". Paste the text here to get Unicode Hindi that works everywhere, or paste Unicode Hindi to get Kruti Dev for a form, test or old template. The direction is detected for you.',
  howTo: [
    'Paste your text. Kruti Dev text looks like "Hkkjr dk lafo/kku"; Unicode Hindi looks like "भारत का संविधान".',
    'Check the result on the right. The converter picks the direction itself, or you can choose it.',
    'Copy or download the result. For Kruti Dev output, paste it into Word or your typing software and set the font to Kruti Dev 010.',
  ],
  options: [
    {
      name: 'Correct matras and half letters',
      description:
        'Kruti Dev stores the short i (ि) before its letters and the reph (र्) after them. The converter moves each to its whole conjunct, so स्थिति, कार्यों, राष्ट्रीय and कीर्ति come out right, which simple find-and-replace converters get wrong.',
    },
    {
      name: 'English words and symbols',
      description:
        'Kruti Dev has no English letters and no ₹ sign. When converting to Kruti Dev, the tool lists the English words and symbols it kept as they are, so you know what to set in an English font. Web and email addresses are never converted.',
    },
    {
      name: 'Word smart quotes',
      description:
        'Word often turns the \' and " keys into curly quotes, which breaks श् and ष् in Kruti Dev files. The converter reads curly quotes back as those letters.',
    },
  ],
  example: {
    title: 'Example',
    input: 'Hkkjr dk lafo/kku 26 tuojh 1950 dks ykxw gqvkA',
    settings: 'Kruti Dev to Unicode',
    output: 'भारत का संविधान 26 जनवरी 1950 को लागू हुआ।',
  },
  limits: [
    'Paste plain Kruti Dev text. If a Kruti Dev file also has English words in another font, those words become Hindi letters once copied as plain text; fix them by hand.',
    'Kruti Dev text only shows as Hindi in the Kruti Dev 010 font, which you need on your computer. This page shows the raw letters.',
    'Kruti Dev uses the same sign for a colon and a visarga (ः), so a colon after a Hindi word may come back as ः.',
  ],
  faqs: [
    {
      question: 'Why does my Hindi text show as "Hkkjr" letters?',
      answer:
        'It was typed in Kruti Dev, a font that draws Hindi on English keys. Without that font, or after copying, you see the English keys. Converting to Unicode makes it real Hindi that shows correctly on any phone or computer.',
    },
    {
      question: 'Which font should I use for the Unicode text?',
      answer:
        'Any Unicode Hindi font: Mangal and Nirmala UI come with Windows, and phones have their own. Unicode text does not depend on one font.',
    },
    {
      question: 'Is the conversion the same as typing test software?',
      answer:
        'It follows the standard Kruti Dev 010 key mapping on the Remington layout that typing tests use. For example, ज्ञ is K, क्ष is {k, त्र is = and श्र is J.',
    },
    {
      question: 'Is my text sent anywhere?',
      answer: 'No. The conversion runs in your browser; nothing you paste leaves your device.',
    },
    {
      question: 'कृतिदेव (Kruti Dev) को यूनिकोड में कैसे बदलें?',
      answer:
        'कृतिदेव में टाइप किया हुआ टेक्स्ट ऊपर वाले बॉक्स में पेस्ट करें (वह "Hkkjr" जैसा दिखता है)। दाईं ओर यूनिकोड हिंदी (भारत) तुरंत मिल जाएगी, जिसे आप WhatsApp, ईमेल या वेबसाइट पर कहीं भी इस्तेमाल कर सकते हैं।',
    },
    {
      question: 'मेरा हिंदी टेक्स्ट "Hkkjr" जैसे अक्षरों में क्यों दिखता है?',
      answer:
        'क्योंकि वह कृतिदेव 010 फॉन्ट में टाइप किया गया है, जो हिंदी को अंग्रेज़ी कीज़ पर बनाता है। फॉन्ट न होने पर या कॉपी करने पर अंग्रेज़ी अक्षर दिखते हैं। यूनिकोड में बदलने के बाद यह हर फ़ोन और कंप्यूटर पर सही दिखेगा।',
    },
  ],
  variants: [
    {
      slug: 'unicode-to-krutidev',
      preset: 'to-krutidev',
      label: 'Unicode to Krutidev',
      h1: 'Unicode to Krutidev converter',
      seoTitle: 'Unicode to Krutidev Converter, Mangal to Kruti Dev 010 | NiftyFix',
      seoDescription:
        'Convert Unicode Hindi (Mangal) to Kruti Dev 010 for typing tests, court and office files. Lists English words and symbols Kruti Dev cannot show. Free.',
      intro:
        'Need text in Kruti Dev 010 for a typing practice passage, a court or office template, or software that only understands Kruti Dev? Paste Unicode Hindi from a website, Google Docs or a phone, and copy the Kruti Dev text into Word with the Kruti Dev 010 font. English words and symbols that Kruti Dev cannot show are listed, so nothing turns into wrong Hindi letters.',
      faqs: [
        {
          question: 'Why does the Kruti Dev output look like English letters?',
          answer:
            'That is how Kruti Dev stores Hindi. Paste it into Word or your typing software and set the font to Kruti Dev 010, and it shows as Hindi.',
        },
        {
          question: 'यूनिकोड (मंगल) हिंदी को कृतिदेव में कैसे बदलें?',
          answer:
            'यूनिकोड हिंदी पेस्ट करें, कृतिदेव टेक्स्ट कॉपी करें और Word या टाइपिंग सॉफ्टवेयर में पेस्ट करके फॉन्ट Kruti Dev 010 चुनें। अंग्रेज़ी शब्द और ₹ जैसे चिह्न, जो कृतिदेव में नहीं बनते, अलग से बताए जाते हैं।',
        },
      ],
    },
  ],
});
