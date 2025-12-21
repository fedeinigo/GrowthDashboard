import { storage } from "./storage";
import { format, subDays } from "date-fns";

async function seed() {
  console.log("Starting database seeding...");

  try {
    // Create Teams
    const teamsData = [
      { name: "leones", displayName: "Leones" },
      { name: "tigres", displayName: "Tigres" },
      { name: "lobos", displayName: "Lobos" },
      { name: "wizards", displayName: "Wizards" },
      { name: "jaguares", displayName: "Jaguares" },
    ];

    console.log("Creating teams...");
    const teams = [];
    for (const team of teamsData) {
      teams.push(await storage.createTeam(team));
    }

    // Create People
    const peopleData = [
      { name: "cami", displayName: "Cami", teamId: teams[0].id },
      { name: "eva", displayName: "Eva García", teamId: teams[0].id },
      { name: "fernanda", displayName: "Fernanda Viani", teamId: teams[1].id },
      { name: "sebastian", displayName: "Sebastian", teamId: teams[1].id },
      { name: "flor", displayName: "Flor", teamId: teams[2].id },
      { name: "karol", displayName: "Karol", teamId: teams[2].id },
      { name: "lina", displayName: "Lina Gutierrez", teamId: teams[2].id },
      { name: "sara", displayName: "Sara Durley", teamId: teams[3].id },
      { name: "esteban", displayName: "Esteban Costacaro", teamId: teams[3].id },
      { name: "steven", displayName: "Steven", teamId: teams[3].id },
      { name: "carlos", displayName: "Carlos Gomez", teamId: teams[4].id },
      { name: "nicolas", displayName: "Nicolas", teamId: teams[4].id },
      { name: "henry", displayName: "Henry Cuentas", teamId: teams[0].id },
      { name: "jesus", displayName: "Jesús", teamId: teams[1].id },
      { name: "agostina", displayName: "Agostina", teamId: teams[2].id },
      { name: "mateo", displayName: "Mateo", teamId: teams[3].id },
      { name: "tomi", displayName: "Tomi", teamId: teams[4].id },
      { name: "joaquin", displayName: "Joaquin", teamId: teams[0].id },
      { name: "luis", displayName: "Luis Fedele", teamId: teams[1].id },
      { name: "luciana", displayName: "Luciana Colombarini", teamId: teams[2].id },
    ];

    console.log("Creating people...");
    const people = [];
    for (const person of peopleData) {
      people.push(await storage.createPerson(person));
    }

    // Create Sources
    const sourcesData = [
      { name: "inbound", displayName: "Inbound Marketing" },
      { name: "outbound", displayName: "Outbound Prospecting" },
      { name: "referral", displayName: "Referidos" },
      { name: "events", displayName: "Eventos" },
      { name: "telefonica_co", displayName: "Telefónica CO" },
      { name: "telefonica_arg", displayName: "Telefónica ARG" },
      { name: "telefonica_mx", displayName: "Telefónica MX" },
      { name: "telefonica_es", displayName: "Telefónica España" },
      { name: "telefonica_peru", displayName: "Telefónica Perú" },
      { name: "telefonica_chile", displayName: "Telefónica Chile" },
      { name: "telefonica_uy", displayName: "Telefónica UY" },
      { name: "directo", displayName: "Directo" },
    ];

    console.log("Creating sources...");
    const sources = [];
    for (const source of sourcesData) {
      sources.push(await storage.createSource(source));
    }

    // Create Products
    const productsData = [
      { name: "Canal WhatsApp", category: "Canales" },
      { name: "BOT QuickBot", category: "Bots" },
      { name: "Canal META", category: "Canales" },
      { name: "Módulo Nitro", category: "Módulos" },
      { name: "Wiser PLUS", category: "Licencias" },
      { name: "Canal Chat Web", category: "Canales" },
      { name: "Bot Encuestador Prodigy", category: "Bots" },
      { name: "Canal Google My Business", category: "Canales" },
    ];

    console.log("Creating products...");
    const products = [];
    for (const product of productsData) {
      products.push(await storage.createProduct(product));
    }

    // Create Regions
    const regionsData = [
      { name: "Colombia" },
      { name: "Argentina" },
      { name: "Mexico" },
      { name: "Brasil" },
      { name: "España" },
      { name: "Rest Latam" },
      { name: "Service as a Software" },
    ];

    console.log("Creating regions...");
    const regions = [];
    for (const region of regionsData) {
      regions.push(await storage.createRegion(region));
    }

    // Create sample leads and activities
    console.log("Creating leads and activities...");
    const companySizes = ["1-10", "11-50", "51-200", "201-500", "500+"];
    const statuses = ["new", "contacted", "proposal", "closed-won", "closed-lost"];
    
    // Create 100 sample leads
    for (let i = 0; i < 100; i++) {
      const randomPerson = people[Math.floor(Math.random() * people.length)];
      const randomSource = sources[Math.floor(Math.random() * sources.length)];
      const randomRegion = regions[Math.floor(Math.random() * regions.length)];
      const randomSize = companySizes[Math.floor(Math.random() * companySizes.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const dealValue = Math.floor(Math.random() * 10000) + 1000;
      
      // Create lead with date in the past 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = subDays(new Date(), daysAgo);
      
      const lead = await storage.createLead({
        companyName: `Company ${i + 1}`,
        companySize: randomSize,
        sourceId: randomSource.id,
        regionId: randomRegion.id,
        assignedToId: randomPerson.id,
        teamId: randomPerson.teamId,
        status: randomStatus,
        dealValue: dealValue.toString(),
      });

      // Create activities for the lead
      // 1-3 meetings
      const meetingCount = Math.floor(Math.random() * 3) + 1;
      for (let m = 0; m < meetingCount; m++) {
        const activityDaysAgo = Math.floor(Math.random() * daysAgo);
        const activityDate = format(subDays(new Date(), activityDaysAgo), "yyyy-MM-dd");
        await storage.createActivity({
          leadId: lead.id,
          type: "meeting",
          date: activityDate,
          notes: `Meeting ${m + 1} with ${lead.companyName}`,
        });
      }

      // If status is proposal or closed, create proposal activity
      if (["proposal", "closed-won", "closed-lost"].includes(randomStatus)) {
        const proposalDaysAgo = Math.floor(Math.random() * daysAgo);
        const proposalDate = format(subDays(new Date(), proposalDaysAgo), "yyyy-MM-dd");
        await storage.createActivity({
          leadId: lead.id,
          type: "proposal",
          date: proposalDate,
          value: dealValue.toString(),
          notes: `Proposal sent to ${lead.companyName}`,
        });
      }

      // If status is closed-won, create closing activity and sales
      if (randomStatus === "closed-won") {
        const closingDaysAgo = Math.floor(Math.random() * Math.min(daysAgo, 5));
        const closingDate = format(subDays(new Date(), closingDaysAgo), "yyyy-MM-dd");
        await storage.createActivity({
          leadId: lead.id,
          type: "closing",
          date: closingDate,
          value: dealValue.toString(),
          notes: `Deal closed with ${lead.companyName}`,
        });

        // Create 1-3 product sales for this lead
        const productCount = Math.floor(Math.random() * 3) + 1;
        for (let p = 0; p < productCount; p++) {
          const randomProduct = products[Math.floor(Math.random() * products.length)];
          const quantity = Math.floor(Math.random() * 5) + 1;
          const productRevenue = Math.floor(dealValue / productCount);
          
          await storage.createSale({
            leadId: lead.id,
            productId: randomProduct.id,
            quantity,
            revenue: productRevenue.toString(),
            saleDate: closingDate,
          });
        }
      }
    }

    console.log("Database seeding completed successfully!");
    console.log(`Created ${teams.length} teams`);
    console.log(`Created ${people.length} people`);
    console.log(`Created ${sources.length} sources`);
    console.log(`Created ${products.length} products`);
    console.log(`Created ${regions.length} regions`);
    console.log(`Created 100 leads with activities and sales`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
