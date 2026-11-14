import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Choose what the QR code should do (open a website, take a UPI payment, join Wi-Fi, start a WhatsApp chat, save a contact, or show text), fill in the details, and download it as a PNG for print and phones or an SVG for designers. The code holds your information directly, so it works forever: there is no redirect link, no sign-up and no expiry, unlike many "free" generators. Pick colours, add your logo, and get a warning if the code might be hard to scan.',
  howTo: [
    'Choose what the code is for.',
    'Fill in the details: the preview updates as you type.',
    'Optionally change colours or add a logo.',
    'Download the PNG or SVG and test it with your phone camera.',
  ],
  options: [
    {
      name: 'UPI payment',
      description:
        'Anyone can scan it with Google Pay, PhonePe, Paytm or any UPI app to pay your UPI ID. Add an amount for a fixed bill, or leave it empty for the payer to type.',
    },
    {
      name: 'Error correction',
      description:
        'How much of the code can be damaged or covered and still scan: L 7%, M 15%, Q 25%, H 30%. A logo switches it to H automatically.',
    },
    {
      name: 'PNG or SVG',
      description:
        'PNG at up to 2048 px for documents, posters and shop counters; SVG stays sharp at any size for printers and designers.',
    },
  ],
  example: {
    title: 'Example',
    input: 'UPI ID ramstores@okhdfcbank, name Ram Stores',
    settings: 'UPI payment, 1024 px PNG',
    output: 'A QR code customers scan to pay Ram Stores in any UPI app',
  },
  limits: [
    'Codes are static: what they hold cannot be changed after printing (that needs a hosted redirect, which also tracks scans).',
    'Very long text makes a dense code that small prints and old phones struggle with.',
  ],
  faqs: [
    {
      question: 'Do these QR codes expire?',
      answer:
        'No. The information is inside the code itself, not behind a link on our server, so it works as long as the printed code is readable.',
    },
    {
      question: 'How do I make a QR code for UPI payments?',
      answer:
        'Choose "UPI payment", enter your UPI ID (such as name@okhdfcbank) and the name to show, optionally an amount, and download. Test it with your own UPI app before printing.',
    },
    {
      question: 'Can I add my logo?',
      answer:
        'Yes. Upload it under "Logo in the middle": the code switches to the highest error correction so it still scans with the centre covered. Always test it before printing.',
    },
    {
      question: 'Is my information sent anywhere?',
      answer: 'No. The code is drawn in your browser; nothing you type leaves the page.',
    },
  ],
  variants: [
    {
      slug: 'upi-qr-code-generator',
      preset: 'upi',
      label: 'UPI QR code generator',
      h1: 'UPI QR code generator: get paid by any UPI app',
      seoTitle: 'UPI QR Code Generator: free payment QR for any UPI ID | NiftyFix',
      seoDescription:
        'Make a UPI payment QR code for your UPI ID, with an optional fixed amount and note. Works with Google Pay, PhonePe, Paytm and BHIM. Free, no sign-up.',
      intro:
        'Turn your UPI ID into a payment QR code for your shop counter, invoices, events or WhatsApp. Customers scan it with Google Pay, PhonePe, Paytm, BHIM or any UPI app and pay you directly. Add a fixed amount and a note for bills, or leave the amount empty so the payer types it.',
      faqs: [
        {
          question: 'Is a UPI QR code made here safe?',
          answer:
            'It holds only your UPI ID, name and the optional amount and note, and payments go straight to your bank through UPI. Scan it with your own app once before sharing to check the name shown.',
        },
      ],
    },
    {
      slug: 'wifi-qr-code-generator',
      preset: 'wifi',
      label: 'Wi-Fi QR code',
      h1: 'Wi-Fi QR code generator: join without typing the password',
      seoTitle: 'Wi-Fi QR Code Generator: share Wi-Fi with a scan, free | NiftyFix',
      seoDescription:
        'Make a QR code that connects phones to your Wi-Fi without typing the password. For homes, cafes, offices and guests. Works on Android and iPhone.',
      intro:
        'Guests scan the code with their phone camera and join your Wi-Fi without typing the password. Enter the network name and password, print it for your cafe, office or living room, and it works on both Android and iPhone.',
      faqs: [
        {
          question: 'How do I connect to Wi-Fi with a QR code?',
          answer:
            'Point the phone camera at the code. iPhones and most Android phones offer to join the network directly, so guests never type or see the password.',
        },
      ],
    },
  ],
});
