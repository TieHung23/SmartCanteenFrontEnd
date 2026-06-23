// Smart Canteen Seed Script - June 21-26, 2026
// Usage: node scripts/seed-june21-26.mjs

const API = "http://178.128.100.1:8080";

async function main() {
  // 1. Login
  const loginRes = await fetch(`${API}/api/Auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "manager.sc@gmail.com", password: "SmartCanteen_01" }),
  });
  const loginData = await loginRes.json();
  const token = loginData.value.accessToken;
  console.log("✅ Login successful");

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // 2. Fetch categories
  const catRes = await fetch(`${API}/api/Categories?pageSize=100`, { headers });
  const catData = await catRes.json();
  const cats = catData.value.items;
  console.log(`✅ Categories: ${cats.length}`);

  // Normalize Vietnamese chars for matching
  const normalize = (s) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const findCatId = (name) => {
    const norm = normalize(name);
    const found = cats.find((c) => normalize(c.name) === norm);
    if (!found) {
      const matches = cats.filter((c) => normalize(c.name).includes(norm));
      if (matches.length === 1) return matches[0].id;
      console.warn(`⚠️  Category not found: "${name}"; available: [${cats.map((c) => c.name).join(", ")}]`);
    }
    return found?.id;
  };

  const CAT = {
    TINH_BOT: findCatId("Tinh Bột"),
    CHAT_DAM: findCatId("Chất Đạm"),
    CHAT_XO: findCatId("Chất Xơ & Vitamin"),
    CANH_NUOC: findCatId("Canh & Nước"),
    DO_UONG: findCatId("Đồ Uống"),
  };
  console.log("   Category mapping:", JSON.stringify(CAT, null, 2));

  // 3. Fetch all dishes, group by category
  const dishRes = await fetch(`${API}/api/Dishes?pageSize=200`, { headers });
  const dishData = await dishRes.json();
  const dishes = dishData.value.items;
  console.log(`✅ Dishes: ${dishes.length}`);

  // Get ALL dish IDs per category
  const getDishIds = (catId) => (catId ? dishes.filter((d) => d.categoryId === catId).map((d) => d.id) : []);

  // Combine all dishes from relevant categories
  const allDishIds = [
    ...getDishIds(CAT.TINH_BOT),
    ...getDishIds(CAT.CHAT_DAM),
    ...getDishIds(CAT.CHAT_XO),
    ...getDishIds(CAT.CANH_NUOC),
    ...getDishIds(CAT.DO_UONG),
  ].filter(Boolean);
  console.log(`✅ Total dishes for sessions: ${allDishIds.length}`);

  // 4. Define templates
  const templates = [
    {
      key: "breakfast",
      name: "Combo Sáng Đầy Đủ",
      settings: [
        { categoryId: CAT.TINH_BOT, minQuantity: 1, maxQuantity: 2, isRequired: true },
        { categoryId: CAT.CHAT_DAM, minQuantity: 1, maxQuantity: 2, isRequired: true },
        { categoryId: CAT.CHAT_XO, minQuantity: 0, maxQuantity: 2, isRequired: false },
        { categoryId: CAT.CANH_NUOC, minQuantity: 0, maxQuantity: 1, isRequired: false },
      ].filter((s) => s.categoryId),
    },
    {
      key: "lunch",
      name: "Combo Trưa Cơ Bản",
      settings: [
        { categoryId: CAT.TINH_BOT, minQuantity: 1, maxQuantity: 1, isRequired: true },
        { categoryId: CAT.CHAT_DAM, minQuantity: 1, maxQuantity: 2, isRequired: true },
        { categoryId: CAT.CHAT_XO, minQuantity: 1, maxQuantity: 1, isRequired: true },
        { categoryId: CAT.CANH_NUOC, minQuantity: 0, maxQuantity: 1, isRequired: false },
        { categoryId: CAT.DO_UONG, minQuantity: 0, maxQuantity: 1, isRequired: false },
      ].filter((s) => s.categoryId),
    },
    {
      key: "dinner",
      name: "Combo Tối Nhẹ",
      settings: [
        { categoryId: CAT.CHAT_DAM, minQuantity: 0, maxQuantity: 2, isRequired: false },
        { categoryId: CAT.CHAT_XO, minQuantity: 0, maxQuantity: 1, isRequired: false },
        { categoryId: CAT.DO_UONG, minQuantity: 0, maxQuantity: 1, isRequired: false },
      ].filter((s) => s.categoryId),
    },
  ];

  // 5. Delete existing sessions for this range
  console.log("   Cleaning up old sessions...");
  for (let day = 21; day <= 26; day++) {
    for (const tpl of templates) {
      const name = `Suất ${tpl.key === "breakfast" ? "Sáng" : tpl.key === "lunch" ? "Trưa" : "Tối"} ${day}/6`;
      const searchRes = await fetch(`${API}/api/Sessions?name=${encodeURIComponent(name)}&pageSize=5`, { headers });
      const searchData = await searchRes.json();
      const items = searchData.value?.items || [];
      for (const item of items) {
        await fetch(`${API}/api/Sessions/${item.id}`, { method: "DELETE", headers });
      }
    }
  }

  // 6. Create sessions
  let successCount = 0;
  let failCount = 0;

  for (let day = 21; day <= 26; day++) {
    const dateStr = `2026-06-${String(day).padStart(2, "0")}`;

    const mealNames = { breakfast: "Sáng", lunch: "Trưa", dinner: "Tối" };

    for (const tpl of templates) {
      const sessionName = `Suất ${mealNames[tpl.key]} ${day}/6`;

      // Deduplicate settings by categoryId
      const seen = new Set();
      const uniqueSettings = tpl.settings.filter((s) => {
        if (seen.has(s.categoryId)) return false;
        seen.add(s.categoryId);
        return true;
      });

      const body = {
        name: sessionName,
        description: `Suất ăn ${mealNames[tpl.key].toLowerCase()} ngày ${dateStr}`,
        availableFrom: `${dateStr}T00:00:00+07:00`,
        availableTo: `${dateStr}T23:59:59+07:00`,
        availableForOrder: `${dateStr}T23:59:59+07:00`,
        finalizationDeadline: `${dateStr}T23:59:59+07:00`,
        autoFinalizePolicy: 0,
        mealTemplates: [{ name: tpl.name, settings: uniqueSettings }],
        dishes: allDishIds.map((id) => ({ dishId: id })),
      };

      try {
        const res = await fetch(`${API}/api/Sessions`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (res.ok && data.isSuccess) {
          console.log(`✅ ${sessionName} — ID: ${data.value.id}`);
          successCount++;
        } else {
          console.error(`❌ ${sessionName} — ${data.message || res.status}`);
          failCount++;
        }
      } catch (err) {
        console.error(`❌ ${sessionName} — ${err.message}`);
        failCount++;
      }
    }
  }

  console.log(`\n🎉 Done! ${successCount} created, ${failCount} failed`);
}

main().catch(console.error);
