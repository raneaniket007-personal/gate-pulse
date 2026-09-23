import "dotenv/config";
import crypto from "node:crypto";

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

    const societies = [
        {
            id: "00000000-0000-0000-0000-000000000001",
            name: "Swastik Pearl",
            address: "Mumbai, Maharashtra",
            gateLatitude: 19.076,
            gateLongitude: 72.8777,
            allowedRadiusMeters: 50,
        }, {
            id: "00000000-0000-0000-0000-000000000002",
            name: "Shraddha Pride",
            address: "Mumbai, Maharashtra",
            gateLatitude: 45.076,
            gateLongitude: 79.8777,
            allowedRadiusMeters: 50,
        },
    ];

    const flats = [
        {
            unitNumber: "A-101",
            residentName: "Rahul Sharma",
            phone: "+919920419564",
        },
        {
            unitNumber: "A-102",
            residentName: "Priya Mehta",
            phone: "+918878641944",
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


    for (const society of societies) {
        await prisma.society.upsert({
            where: {
                id: society.id,
            },
            update: {},
            create: {
                id: society.id,
                name: society.name,
                address: society.address,
                gateLatitude: society.gateLatitude,
                gateLongitude: society.gateLongitude,
                allowedRadiusMeters: society.allowedRadiusMeters,
            },
        });

        for (const flat of flats) {
            const flatRecord = await prisma.flat.upsert({
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

            await prisma.resident.upsert({
                where: { flatId: flatRecord.id },
                update: {
                    name: flat.residentName,
                    phone: flat.phone,
                    pinHash: crypto.createHash("sha256").update("1234").digest("hex"),
                },
                create: {
                    flatId: flatRecord.id,
                    name: flat.residentName,
                    phone: flat.phone,
                    pinHash: crypto.createHash("sha256").update("1234").digest("hex"),
                },
            });
        }

        console.log(`Created society: ${society.name}`);
        console.log(`Created/updated ${flats.length} flats and residents`);
    }
}


main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });