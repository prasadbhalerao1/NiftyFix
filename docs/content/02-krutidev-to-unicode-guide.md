# Why your Hindi text turns into "Hkkjr", and how to fix it (Kruti Dev to Unicode)

_For Medium or LinkedIn. Suggested tags: Hindi, Typing, Government Jobs, Microsoft Word, India._

You copy a Hindi paragraph from an office file into WhatsApp, and this arrives:

> Hkkjr dk lafo/kku 26 tuojh 1950 dks ykxw gqvkA

It should have said:

> भारत का संविधान 26 जनवरी 1950 को लागू हुआ।

Nothing is broken. The text was typed in **Kruti Dev**, and Kruti Dev is not really Hindi
text at all.

## What Kruti Dev actually is

Kruti Dev 010 is a font from before Hindi had a proper computer standard. It draws Hindi
letters on top of English keys: the file stores "Hkkjr", and the font makes those letters
look like भारत. Remove the font (by copying the text, opening it on a phone, or putting
it on a website) and you see the English keys again.

The modern standard is **Unicode** (fonts like Mangal and Nirmala UI on Windows, and
every phone). Unicode Hindi is real text: it shows correctly everywhere, Google can
search it, and you can paste it anywhere.

## Then why is Kruti Dev still used?

- **Typing tests.** Many recruitment typing tests still use it. For example, the High
  Court of Himachal Pradesh's typing test instructions specify the font "Kruti Dev 10",
  and the Rajasthan High Court's specify "Kruti Dev 010".
- **Years of office files**, notices and templates typed in it.
- **Typists trained on it**, using the Remington layout.

So people keep needing to move text between the two.

## Why simple converters get words wrong

Kruti Dev stores letters in the order you see them, not the order you say them:

- The short i matra (ि) is typed **before** its letter. In स्थिति it must move after the
  whole "स्थ" cluster, not just the next key.
- The reph (र् drawn on top, as in कर्म) is typed **after** its letter and has to move
  before it.
- Conjuncts like क्ष ({k), त्र (=), ज्ञ (K) and श्र (J) have their own keys.

A find-and-replace converter that ignores these rules turns कार्यों, राष्ट्रीय and कीर्ति
into nonsense.

## How to convert, both ways

I built a free converter that follows these rules:
[Krutidev to Unicode Converter](https://niftyfix.in/text/krutidev-to-unicode/).

- Paste Kruti Dev text and get Unicode Hindi to share anywhere.
- Paste Unicode Hindi and get Kruti Dev for a typing practice passage or an old template
  ([Unicode to Krutidev](https://niftyfix.in/text/unicode-to-krutidev/)). Then paste it
  into Word and set the font to Kruti Dev 010.
- It detects the direction by itself.
- When converting to Kruti Dev, it warns you about English words and symbols like ₹ that
  Kruti Dev cannot show, so they do not silently turn into wrong Hindi letters.
- It runs in your browser, so nothing you paste is sent anywhere.

## One tip for Word users

Word's AutoCorrect turns ' and " into curly quotes. In a Kruti Dev document those keys
are the letters श् and ष्, so AutoCorrect quietly changes your Hindi. Turn off
"straight quotes with smart quotes" (File > Options > Proofing > AutoCorrect Options >
AutoFormat As You Type) while typing in Kruti Dev. The converter above also repairs
text that already has curly quotes.
