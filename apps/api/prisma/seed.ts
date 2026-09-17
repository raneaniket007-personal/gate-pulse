import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
    connectionString: process.env.DIRECT_URL,
});

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    console.log("Seeding database...");

    const society = await prisma.society.upsert({
        where: {
            id: "00000000-0000-0000-0000-000000000001",
        },
        update: {},
        create: {
            id: "00000000-0000-0000-0000-000000000001",
            name: "GatePulse Residency",
            address: "Mumbai, Maharashtra",
            gateLatitude: 19.076,
            gateLongitude: 72.8777,
            allowedRadiusMeters: 50,
        },
    });

    const flats = [
        {
            unitNumber: "A-101",
            residentName: "Rahul Sharma",
            phone: "+919999999101",
        },
        {
            unitNumber: "A-102",
            residentName: "Priya Mehta",
            phone: "+919999999102",
        },
        {
            unitNumber: "A-103",
            residentName: "Amit Patil",
            phone: "+919999999103",
        },
        {
            unitNumber: "A-104",
            residentName: "Neha Joshi",
            phone: "+919999999104",
        },
        {
            unitNumber: "A-105",
            residentName: "Vikram Singh",
            phone: "+919999999105",
        },
    ];

    for (const flat of flats) {
        await prisma.flat.upsert({
            where: {
                societyId_unitNumber: {
                    societyId: society.id,
                    unitNumber: flat.unitNumber,
                },
            },
            update: {
                residentName: flat.residentName,
                phone: flat.phone,
            },
            create: {
                societyId: society.id,
                unitNumber: flat.unitNumber,
                residentName: flat.residentName,
                phone: flat.phone,
            },
        });
    }

    console.log(`Created society: ${society.name}`);
    console.log(`Created/updated ${flats.length} flats`);
}


main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });