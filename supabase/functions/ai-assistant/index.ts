import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();
    // mode: "customer" | "agent-summarize" | "agent-suggest-reply"

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let systemPrompt = "";

    if (mode === "customer") {
      // Fetch live data for context
      const [countriesRes, visaTypesRes, offersRes] = await Promise.all([
        supabase
          .from("countries")
          .select("name, code, is_schengen")
          .eq("is_active", true)
          .order("display_order"),
        supabase
          .from("visa_types")
          .select("name, price, processing_days, child_price, infant_price, fee_type, government_fees, entry_type, max_stay_days, validity_days, requirements, country:countries(name)")
          .eq("is_active", true),
        supabase
          .from("special_offers")
          .select("title, country_name, sale_price, original_price, discount_percentage, end_date")
          .eq("is_active", true),
      ]);

      const countries = countriesRes.data || [];
      const visaTypes = visaTypesRes.data || [];
      const offers = offersRes.data || [];

      systemPrompt = `أنت مساعد ذكي لشركة "رحالة" للتأشيرات. مهمتك مساعدة العملاء بالإجابة على أسئلتهم عن التأشيرات والأسعار والمتطلبات.

## قواعد مهمة:
- أجب بالعربية دائماً إلا إذا سألك العميل بالإنجليزية
- كن مختصراً وواضحاً ومحترفاً
- استخدم البيانات الحقيقية فقط من المعلومات المتاحة أدناه
- إذا سُئلت عن شيء غير موجود في البيانات، قل "للأسف ما عندي هالمعلومة حالياً، تقدر تتواصل مع فريقنا عبر واتساب وبيساعدونك"
- لا تخترع أسعار أو معلومات غير موجودة
- إذا العميل جاهز للتقديم، وجّهه لصفحة التقديم
- رقم واتساب الشركة: 966920034158

## الدول المتاحة:
${countries.map((c: any) => `- ${c.name} (${c.code})${c.is_schengen ? " - شنغن" : ""}`).join("\n")}

## أنواع التأشيرات والأسعار:
${visaTypes.map((v: any) => {
  const country = (v as any).country?.name || "";
  const reqs = v.requirements ? JSON.stringify(v.requirements) : "غير محدد";
  return `- ${country} - ${v.name}: ${v.price} ر.س | أطفال: ${v.child_price || "غير محدد"} ر.س | رضع: ${v.infant_price || "غير محدد"} ر.س | مدة المعالجة: ${v.processing_days} يوم | نوع الدخول: ${v.entry_type || "غير محدد"} | الإقامة: ${v.max_stay_days || "غير محدد"} يوم | الصلاحية: ${v.validity_days || "غير محدد"} يوم | الرسوم: ${v.fee_type === "included" ? "شاملة" : `منفصلة (${v.government_fees} ر.س)`}`;
}).join("\n")}

## العروض الحالية:
${offers.length > 0 ? offers.map((o: any) => `- ${o.title}: ${o.country_name} - السعر ${o.sale_price} ر.س بدل ${o.original_price} ر.س (خصم ${o.discount_percentage}%) - ينتهي ${o.end_date}`).join("\n") : "لا توجد عروض حالياً"}
`;
    } else if (mode === "agent-summarize") {
      systemPrompt = `أنت مساعد ذكي داخلي لفريق عمل شركة تأشيرات. مهمتك تلخيص الملاحظات والمحادثات بشكل مختصر ومفيد للوكيل.
- لخص النقاط الرئيسية
- حدد المهام المعلقة إن وجدت
- اذكر أي مشاكل أو تنبيهات مهمة
- كن مختصراً ومباشراً`;
    } else if (mode === "agent-suggest-reply") {
      systemPrompt = `أنت مساعد ذكي لوكلاء شركة تأشيرات. مهمتك اقتراح رد احترافي ومناسب على رسالة العميل.
- الرد يكون بالعربية
- احترافي ولطيف
- يجاوب على سؤال العميل بشكل مباشر
- اقترح رد واحد فقط جاهز للإرسال
- لا تضيف مقدمات مثل "إليك الرد المقترح"، ابدأ بالرد مباشرة`;
    } else {
      throw new Error("Invalid mode");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "عدد الطلبات تجاوز الحد المسموح، حاول بعد قليل" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "يرجى إعادة شحن رصيد الذكاء الاصطناعي" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "حدث خطأ في الخدمة" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
