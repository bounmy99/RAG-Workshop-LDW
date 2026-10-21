/**
 * Helper ກາງສຳລັບທຸກ CLI lab
 *
 * ເນື້ອໃນຫຼັກຢູ່ໃນ core.ts (ໃຊ້ຮ່ວມກັບໜ້າແຊັດ) — ໄຟລ໌ນີ້ພຽງແຕ່ກວດ API key ກ່ອນຮັນ lab
 */
export * from './core.ts';

if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ ບໍ່ພົບ OPENROUTER_API_KEY — cp .env.example .env ແລ້ວໃສ່ key, ຈາກນັ້ນ pnpm lab:1');
    process.exit(1);
}
