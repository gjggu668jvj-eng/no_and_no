// ══════════════════════════════════════════════════════════════
// 📚 صائد الكتب والمراجع والكورسات العالمية (Shadow Harvester)
// ══════════════════════════════════════════════════════════════

export default [
  {
    name: 'كتاب',
    aliases: ['pdf', 'كتب', 'مكتبة', 'رواية', 'كتاب_pdf', 'كورس'],
    desc: 'البحث عن أي كتاب، رواية، مرجع علمي، أو كورس مجاناً وتحميله بصيغة PDF',
    async run({ sock, jid, m, args, restText, reply }) {
      const query = restText || args.join(' ');
      if (!query) {
        return reply('📚 *صائد الكتب والمراجع الأكاديمية (Shadow Harvester)*\n\nاكتب اسم الكتاب أو الرواية أو الكورس:\nمثال: *.كتاب مقدمة ابن خلدون*\nأو: *.كتاب تعلم بايثون من الصفر*');
      }

      await sock.sendMessage(jid, { react: { text: '📖', key: m.key } }).catch(() => {});

      try {
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=3`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.items || !data.items.length) {
          return reply(`❌ لم يتم العثور على كتب تطابق: "${query}". تأكد من كتابة الاسم بدقة.`);
        }

        const book = data.items[0].volumeInfo;
        const title = book.title || query;
        const authors = (book.authors || []).join('، ') || 'مؤلف غير محدد';
        const date = book.publishedDate || 'غير معروف';
        const pageCount = book.pageCount || 'غير محدد';
        const desc = (book.description || 'كتاب قيم وغني بالمعلومات والمراجع القيمة.').slice(0, 300);

        // روابط بحث وتحميل مباشر من مستودعات الكتب المفتوحة وArchive
        const archiveLink = `https://archive.org/search.php?query=${encodeURIComponent(query)}&and[]=mediatype%3A%22texts%22`;
        const pdfDriveLink = `https://www.google.com/search?q=filetype:pdf+${encodeURIComponent(query)}`;

        const card = `╭━━━〔 📚 *تفاصيل الكتاب والمراجع* 〕━━━╮\n│\n` +
          `│ 📖 *اسم الكتاب:* ${title}\n` +
          `│ ✍️ *المؤلف:* ${authors}\n` +
          `│ 📄 *عدد الصفحات:* ${pageCount} صفحة\n` +
          `│ 📅 *سنة النشر:* ${date}\n│\n` +
          `│ 📝 *نبذة مختصرة:*\n│ ${desc}...\n│\n` +
          `│ 📥 *روابط التحميل المباشر بصيغة PDF:*\n` +
          `│ 1️⃣ *Internet Archive (مكتبة الأرشيف الدولية):*\n` +
          `│    🔗 ${archiveLink}\n│\n` +
          `│ 2️⃣ *بحث وتنزيل PDF فوري:* \n` +
          `│    🔗 ${pdfDriveLink}\n│\n` +
          `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        if (book.imageLinks?.thumbnail) {
          return await sock.sendMessage(jid, { image: { url: book.imageLinks.thumbnail }, caption: card }, { quoted: m });
        }
        return reply(card);
      } catch (err) {
        reply(`❌ فشل البحث عن الكتاب: ${err.message}`);
      }
    }
  }
];
