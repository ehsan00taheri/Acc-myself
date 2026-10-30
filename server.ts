import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// HMR is disabled in AI Studio dev environment to prevent WebSocket transport errors in preview iframe
if (process.env.DISABLE_HMR === undefined) {
  process.env.DISABLE_HMR = "true";
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// متد تنبل (Lazy) برای ساخت کلاینت جمینای
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY تنظیم نشده است.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// مسیر بررسی وضعیت سرور (Health Check)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "smart-accounting-api" });
});

// مسیر پردازش هوشمند متن تراکنش با جمینای
app.post("/api/parse-transaction", async (req, res) => {
  try {
    const { text, referenceDate, availableCategories } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({
        isValidTransaction: false,
        errorMessage: "لطفاً یک متن برای ثبت تراکنش وارد کنید.",
      });
    }

    const ai = getGeminiClient();

    // محاسبه تاریخ امروز به فرمت شمسی برای زمینه مدل
    const now = new Date();
    const todayShamsi = new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const categoriesListText =
      Array.isArray(availableCategories) && availableCategories.length > 0
        ? `لیست دسته‌بندی‌های فعال و شخصی کاربر (حتماً از بین این موارد یا مناسب‌ترین دسته‌بندی انتخاب کن):\n` +
          availableCategories.map((c: string) => `   - '${c}'`).join("\n")
        : `دسته‌بندی‌های استاندارد:\n` +
          `   - 'خوراک و نوشیدنی'\n` +
          `   - 'حمل‌ونقل'\n` +
          `   - 'مسکن و قبوض'\n` +
          `   - 'خرید و پوشاک'\n` +
          `   - 'سلامت و درمان'\n` +
          `   - 'تفریح و سرگرمی'\n` +
          `   - 'آموزش و کتاب'\n` +
          `   - 'حقوق و دستمزد'\n` +
          `   - 'سرمایه‌گذاری و پس‌انداز'\n` +
          `   - 'پاداش و هدیه'\n` +
          `   - 'فروش و تجارت'\n` +
          `   - 'سایر'`;

    const systemInstruction = `شما یک دستیار هوشمند و فوق‌العاده دقیق برای استخراج و ثبت تراکنش‌های مالی و حسابداری شخصی به زبان فارسی هستید.
وظیفه شما تبدیل جملات طبیعی کاربر به یک تراکنش ساختاریافته مالی به همراه دسته‌بندی و حسابی که از آن پرداخت/دریافت شده است می‌باشد.

تاریخ امروز شمسی مرجع: ${todayShamsi} (تاریخ میلادی: ${now.toISOString().split("T")[0]})

دستورالعمل‌ها:
۱. مبلغ (amount):
   - همیشه مبلغ را به واحد «تومان» و به عنوان یک عدد صحیح مثبت بدون اعشار محاسبه کن.
   - به کلمات مقیاس دقت کن: «میلیون» = 1,000,000 ، «هزار» = 1,000 ، «هزار تومان» = 1,000 ، «میلیارد» = 1,000,000,000.
   - مثال: «۳۵ هزار تومان» -> 35000 | «۱۵ میلیون» -> 15000000 | «۲۵۰ تومن» -> 250000 | «۱.۵ میلیون» -> 1500000 | «۲ و نیم میلیون» -> 2500000 | «۵۰۰ هزار ریال» -> 50000 (چون هر ۱۰ ریال ۱ تومان است).
   - اگر عددی ذکر نشده باشد یا فقط سلام و احوال‌پرسی یا متن نامربوط باشد، isValidTransaction را false بگذار.

۲. نوع تراکنش (type):
   - 'expense' برای تمامی هزینه‌ها، خریدها، پرداخت قبوض، اجاره، تاکسی، بنزین، رستوران و ...
   - 'income' برای درآمدها، حقوق، دستمزد، واریز، پاداش، هدیه نقدی، فروش، سود و ...

۳. دسته‌بندی (category):
   بر اساس مفهوم جمله و لیست دسته‌های زیر، دقیق‌ترین دسته‌بندی را انتخاب کن (اگر کاربر دسته شخصی مرتبطی مانند «باشگاه»، «پت»، «اقساط» و... دارد، آن را ترجیح بده):
${categoriesListText}

۴. حساب پرداخت‌کننده یا دریافت‌کننده (account):
   - اگر کاربر به نام بانک یا حساب اشاره کرد (مانند «کارت ملی»، «بانک ملت»، «بلو بانک»، «سامان»، «پاسارگاد»، «تجارت»، «صادرات»، «نقدی»، «کیف پول»)، نام آن را تمیز استخراج کن (مثلا: "کارت بانک ملی"، "حساب بانک ملت"، "بلو بانک"، "نقدی").
   - اگر نامی نبرده بود، مقدار پیش‌فرض "کارت اصلی" را برگردان.

۵. عنوان تراکنش (title):
   - یک عنوان کوتاه و خوانا (حداکثر ۴ یا ۵ کلمه) مثل «ناهار کاری»، «حقوق اردیبهشت»، «خرید میوه و سوپرمارکت»، «کرایه اسنپ»، «پرداخت قبض برق».

۶. تاریخ تراکنش (persianDate):
   - اگر کاربر گفت «امروز» یا به تاریخ اشاره نکرد، تاریخ امروز شمسی (${todayShamsi}) را برگردان.
   - اگر گفت «دیروز»، «پریروز»، «هفته پیش»، یا اسامی ماه‌های شمسی مانند «اردیبهشت»، تاریخ شمسی مناسب را تقریب بزن یا ثبت کن.

۷. اعتبار سنجی (isValidTransaction & errorMessage):
   - اگر جمله کاربر ربطی به هزینه یا درآمد نداشت (مثلاً «سلام»، «امروز هوا چطوره»، «یک داستان بگو»، یا صرفاً جملات بی‌مفهوم بدون مبلغ)، مقدار isValidTransaction را false قرار بده و یک پیام خطای راهنمای صمیمانه و شفاف به فارسی در errorMessage بگذار (مثلاً: «متن وارد شده شامل اطلاعات مالی مشخصی نیست. لطفاً جمله‌ای مانند "۳۵ هزار تومان برای ناهار دادم" وارد کنید.»).
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `متن کاربر برای ثبت تراکنش:\n"${text}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValidTransaction: {
              type: Type.BOOLEAN,
              description: "آیا ورودی یک تراکنش مالی معتبر شامل مبلغ است؟",
            },
            amount: {
              type: Type.INTEGER,
              description: "مبلغ نهایی محاسبه شده به تومان (عدد صحیح)",
            },
            type: {
              type: Type.STRING,
              enum: ["expense", "income"],
              description: "نوع تراکنش (هزینه یا درآمد)",
            },
            category: {
              type: Type.STRING,
              description: "نام دسته‌بندی استخراج شده",
            },
            account: {
              type: Type.STRING,
              description: "حساب یا کارتی که از آن پرداخت شده یا دریافت شده است",
            },
            title: {
              type: Type.STRING,
              description: "عنوان خلاصه و تمیز برای تراکنش",
            },
            persianDate: {
              type: Type.STRING,
              description: "تاریخ شمسی تراکنش مثلا ۱۴۰۳/۰۶/۱۱",
            },
            note: {
              type: Type.STRING,
              description: "توضیحات تکمیلی در صورت وجود",
            },
            errorMessage: {
              type: Type.STRING,
              description: "پیام خطا به زبان فارسی در صورتی که متن نامعتبر باشد",
            },
          },
          required: ["isValidTransaction"],
        },
      },
    });

    const rawJson = response.text?.trim() || "{}";
    const result = JSON.parse(rawJson);

    return res.json(result);
  } catch (error: any) {
    console.error("خطا در پردازش تراکنش با جمینای:", error);
    return res.status(500).json({
      isValidTransaction: false,
      errorMessage:
        "متأسفانه در تحلیل متن خطایی رخ داد. لطفاً دوباره امتحان کنید.",
    });
  }
});

// راه‌اندازی میدل‌ویر Vite در حالت توسعه یا فایل‌های استاتیک در حالت پروداکشن
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const isHmrDisabled = process.env.DISABLE_HMR === "true";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : undefined,
        watch: isHmrDisabled ? null : {},
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`سرور حسابداری هوشمند روی پورت ${PORT} آماده به کار است.`);
  });
}

startServer();
