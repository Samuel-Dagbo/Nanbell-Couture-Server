require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");
const Template = require("../models/Template");
const ShopItem = require("../models/ShopItem");
const Order = require("../models/Order");

const randomPhone = (i) => `+23324${String(100000 + i).slice(-6)}`;

const seed = async () => {
  await connectDB();

  await Promise.all([User.deleteMany({}), Template.deleteMany({}), ShopItem.deleteMany({}), Order.deleteMany({})]);

  const adminPassword = await bcrypt.hash("admin12345", 10);
  const customerPassword = await bcrypt.hash("customer123", 10);

  const admin = await User.create({
    fullName: "Admin User",
    phone: "+233200000000",
    email: "admin@fashion.local",
    password: adminPassword,
    role: "admin"
  });

  const customerNames = [
    "Ama Owusu", "Esi Mensah", "Akua Boateng", "Abena Ofori", "Serwaa Asante",
    "Nana Adjoa", "Priscilla Appiah", "Mabel Amoah", "Linda Nyarko", "Yaa Sarpong",
    "Joan Osei", "Belinda Frimpong", "Portia Adu", "Rita Boadi", "Gloria Tetteh",
    "Patience Koomson", "Deborah Annan", "Freda Addo", "Martha Kyei", "Eunice Agyeman"
  ];

  const customers = await User.insertMany(
    customerNames.map((name, i) => ({
      fullName: name,
      phone: randomPhone(i + 1),
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@mail.local`,
      password: customerPassword,
      role: "customer"
    }))
  );

  const templateData = [
    ["Kente Bridal Inspiration", "Elegant kente bridal concept with layered drape."],
    ["Modern Mermaid Cut", "Fitted silhouette with dramatic lower flare."],
    ["Royal Engagement Look", "Structured gown for engagement ceremonies."],
    ["Minimal Satin Evening", "Simple satin flow with contemporary neckline."],
    ["Traditional Corset Blend", "Classic corset top with African print fusion."],
    ["Off-Shoulder Statement", "Bold off-shoulder design for premium events."],
    ["Ankara Flare Concept", "Playful Ankara flare concept for festive settings."],
    ["Executive Church Dress", "Refined church-wear custom design concept."],
    ["Lace Panel Masterpiece", "Custom lace panel layering for luxury finish."],
    ["Asymmetric Gala Dress", "Asymmetric structure with modern couture feel."],
    ["Peplum Occasion Set", "Peplum-inspired design for formal occasions."],
    ["Flowing Mother-of-Bride", "Graceful full-length mother-of-bride concept."]
  ];

  const templateImages = [
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c",
    "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b",
    "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b",
    "https://images.unsplash.com/photo-1464863979621-258859e62245",
    "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7",
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    "https://images.unsplash.com/photo-1554412933-514a83d2f3c8",
    "https://images.unsplash.com/photo-1566479179817-c0b0b3df16cc",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff"
  ];

  const templates = await Template.insertMany(
    templateData.map((t, i) => ({ name: t[0], description: t[1], imageUrl: templateImages[i % templateImages.length] }))
  );

  const shopData = [
    ["Ready-Made Evening Gown", 299], ["Ready-Made Summer Dress", 189], ["Ready-Made Cocktail Dress", 249],
    ["Ready-Made Kente Maxi", 269], ["Ready-Made Lace Midi", 219], ["Ready-Made Office Chic", 159],
    ["Ready-Made Bridal Robe", 199], ["Ready-Made Party Mini", 179], ["Ready-Made Elegant Kaftan", 169],
    ["Ready-Made Ankara Classic", 149], ["Ready-Made Date-Night Dress", 209], ["Ready-Made Gala Piece", 319],
    ["Ready-Made Church Set", 189], ["Ready-Made Smart Casual", 139], ["Ready-Made Premium Velvet", 289]
  ];

  const shopImages = [
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c",
    "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b",
    "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7",
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    "https://images.unsplash.com/photo-1554412933-514a83d2f3c8",
    "https://images.unsplash.com/photo-1566479179817-c0b0b3df16cc",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff"
  ];

  const shopItems = await ShopItem.insertMany(
    shopData.map((s, i) => ({
      name: s[0],
      description: `${s[0]} available for immediate purchase.`,
      imageUrl: shopImages[i % shopImages.length],
      price: s[1],
      available: true
    }))
  );

  const now = new Date();
  const addDays = (d) => {
    const x = new Date(now);
    x.setDate(x.getDate() + d);
    return x;
  };

  await Order.insertMany([
    {
      orderCode: `ORD-${Date.now()}-1001`,
      customer: customers[0]._id,
      shopItem: shopItems[0]._id,
      orderType: "shop",
      quantity: 1,
      size: "M",
      status: "In Progress",
      expectedCompletionDate: addDays(2),
      showEstimatedDate: true,
      transactionCompleted: false,
      notes: "Urgent for event"
    },
    {
      orderCode: `ORD-${Date.now()}-1002`,
      customer: customers[1]._id,
      shopItem: shopItems[1]._id,
      orderType: "shop",
      quantity: 2,
      size: "L",
      status: "Ready for Pickup",
      expectedCompletionDate: addDays(0),
      showEstimatedDate: true,
      transactionCompleted: false,
      notes: "Waiting for customer pickup"
    },
    {
      orderCode: `ORD-${Date.now()}-1003`,
      customer: customers[2]._id,
      template: templates[2]._id,
      dressType: "Custom Engagement Dress",
      orderType: "custom",
      quantity: 1,
      size: "S",
      status: "Ready for Pickup",
      expectedCompletionDate: addDays(-1),
      showEstimatedDate: false,
      transactionCompleted: true,
      completedAt: addDays(0),
      notes: "Transaction completed"
    }
  ]);

  console.log("Seed completed.");
  console.log("Admin login: admin@fashion.local / admin12345");
  console.log("Sample customer login: ama.owusu@mail.local / customer123");
  console.log(`Seeded ${customers.length} customers, ${templates.length} templates, ${shopItems.length} shop items.`);
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
