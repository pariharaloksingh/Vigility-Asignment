'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const bcrypt      = require('bcryptjs');
const sequelize   = require('../config/db');
const { User, FeatureClick } = require('../models');

// ─── Config ──────────────────────────────────────────────────────────────────

const TOTAL_USERS         = 20;
const TOTAL_FEATURE_CLICKS = 200;
const PLAIN_PASSWORD      = '123456';
const BCRYPT_ROUNDS       = 10;

const FEATURE_NAMES = [
  'date_filter',
  'age_filter',
  'gender_filter',
  'bar_chart_click',
  'line_chart_view',
  'apply_filters',
  'reset_filters',
];

const GENDERS = ['Male', 'Female', 'Other'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Random integer in [min, max] inclusive */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Random element from an array */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Random Date within the last `days` days.
 * We spread clicks realistically across different hours too.
 */
const randomPastDate = (days = 30) => {
  const now  = Date.now();
  const msAgo = randInt(0, days * 24 * 60 * 60 * 1000 - 1);
  return new Date(now - msAgo);
};

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  try {
    console.log('\n🌱  Seeding started...\n');

    // ── 1. Verify DB connection ────────────────────────────────────────────
    await sequelize.authenticate();
    console.log('✅  Database connected.');

    // ── 2. Sync tables (no alter — trust existing schema) ─────────────────
    await sequelize.sync();

    // ── 3. Clear existing data (FK order: children first) ─────────────────
    console.log('🧹  Clearing existing data...');
    await FeatureClick.destroy({ where: {}, truncate: true, cascade: true });
    await User.destroy({ where: {}, truncate: true, cascade: true });
    console.log('    Tables cleared.\n');

    // ── 4. Hash password once — reuse for all seed users ──────────────────
    const hashedPassword = await bcrypt.hash(PLAIN_PASSWORD, BCRYPT_ROUNDS);

    // ── 5. Build user records ──────────────────────────────────────────────
    const userRecords = Array.from({ length: TOTAL_USERS }, (_, i) => ({
      username: `user${i + 1}`,
      password: hashedPassword,
      age:      randInt(16, 60),
      gender:   pick(GENDERS),
    }));

    const createdUsers = await User.bulkCreate(userRecords, {
      validate:        true,
      returning:       true,   // PostgreSQL returns the inserted rows with IDs
      individualHooks: false,  // skip per-row hooks for speed
    });

    console.log(`✅  Users created         → ${createdUsers.length} records`);

    // ── 6. Build feature-click records ────────────────────────────────────
    const userIds = createdUsers.map(u => u.id);

    const clickRecords = Array.from({ length: TOTAL_FEATURE_CLICKS }, () => {
      const clickedAt = randomPastDate(30);
      return {
        userId:      pick(userIds),
        featureName: pick(FEATURE_NAMES),
        // Custom timestamp column on the model
        timestamp:   clickedAt,
        // Override Sequelize's automatic createdAt so analytics date-grouping
        // uses the historical date, not the seed-run date
        createdAt:   clickedAt,
        updatedAt:   clickedAt,
      };
    });

    await FeatureClick.bulkCreate(clickRecords, {
      validate:        false,  // trust our own data — skip per-row validation
      individualHooks: false,
    });

    console.log(`✅  Feature clicks created → ${TOTAL_FEATURE_CLICKS} records`);

    // ── 7. Summary ────────────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉  Seeding completed successfully!');
    console.log('    Login with any  username : user1 … user20');
    console.log('    Password                 : 123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);

  } catch (err) {
    console.error('\n❌  Seeding failed:', err.message || err);
    if (err.errors) {
      err.errors.forEach(e => console.error('   •', e.message));
    }
    process.exit(1);
  }
}

seed();
