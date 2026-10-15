#!/usr/bin/env node
/**
 * Dreamy Needle — Review Manager CLI
 * Quickly view, delete, or clear reviews from reviews.json (Local) or Live Vercel (Cloud)
 *
 * Local Usage:
 *   node manage-reviews.js list
 *   node manage-reviews.js delete <id>
 *   node manage-reviews.js clear
 *
 * Live Vercel Usage (Approach B):
 *   node manage-reviews.js live-list https://your-site.vercel.app
 *   node manage-reviews.js live-delete https://your-site.vercel.app <id> [admin_secret]
 */

const fs = require('fs');
const path = require('path');

const REVIEWS_FILE = path.join(__dirname, 'reviews.json');

function loadLocalReviews() {
  if (!fs.existsSync(REVIEWS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf-8') || '[]');
  } catch (e) {
    return [];
  }
}

function saveLocalReviews(reviews) {
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
}

function printReviewsTable(reviews, title = 'Stored Reviews') {
  console.log(`\n📋 Dreamy Needle — ${title} (${reviews.length} total):`);
  console.log('─'.repeat(70));
  if (reviews.length === 0) {
    console.log('No reviews currently stored.');
  } else {
    reviews.forEach((r, idx) => {
      console.log(`[#${idx + 1}] ID: ${r.id} | Rating: ${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}`);
      console.log(`     Client: ${r.name || 'Anonymous'} (${r.city || 'India'}) • Item: ${r.item || 'Custom'}`);
      console.log(`     Date:   ${r.date || 'Verified Customer'}`);
      console.log(`     Text:   "${r.text}"`);
      console.log('─'.repeat(70));
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  // --- LOCAL COMMANDS ---
  if (command === 'list') {
    const reviews = loadLocalReviews();
    printReviewsTable(reviews, 'Local File Reviews');
    console.log('\nTo delete a local review, run: node manage-reviews.js delete <id>');
    return;
  }

  if (command === 'delete') {
    const targetId = args[1];
    if (!targetId) {
      console.error('❌ Error: Please specify the review ID to delete.');
      console.error('Usage: node manage-reviews.js delete <id>');
      process.exit(1);
    }
    const reviews = loadLocalReviews();
    const filtered = reviews.filter(r => String(r.id) !== String(targetId));
    if (filtered.length === reviews.length) {
      console.log(`⚠️ No review found with ID: ${targetId}`);
    } else {
      saveLocalReviews(filtered);
      console.log(`✅ Successfully removed review with ID: ${targetId}`);
      console.log(`   Remaining local reviews: ${filtered.length}`);
    }
    return;
  }

  if (command === 'clear') {
    saveLocalReviews([]);
    console.log('✅ Cleared all local reviews from reviews.json.');
    return;
  }

  // --- LIVE VERCEL COMMANDS (Approach B) ---
  if (command === 'live-list') {
    const siteUrl = args[1];
    if (!siteUrl) {
      console.error('❌ Error: Please specify your live Vercel site URL.');
      console.error('Usage: node manage-reviews.js live-list https://your-site.vercel.app');
      process.exit(1);
    }
    const endpoint = `${siteUrl.replace(/\/$/, '')}/api/reviews`;
    console.log(`📡 Fetching live reviews from: ${endpoint}...`);
    try {
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const reviews = await res.json();
      printReviewsTable(reviews, 'Live Vercel Reviews (Cloud)');
      console.log(`\nTo delete a live review, run: node manage-reviews.js live-delete ${siteUrl} <id>`);
    } catch (err) {
      console.error(`❌ Failed to fetch live reviews: ${err.message}`);
    }
    return;
  }

  if (command === 'live-delete') {
    const siteUrl = args[1];
    const targetId = args[2];
    const secret = args[3] || process.env.ADMIN_SECRET || 'dreamy-admin';

    if (!siteUrl || !targetId) {
      console.error('❌ Error: Missing site URL or review ID.');
      console.error('Usage: node manage-reviews.js live-delete https://your-site.vercel.app <id> [admin_secret]');
      process.exit(1);
    }

    const endpoint = `${siteUrl.replace(/\/$/, '')}/api/reviews?id=${encodeURIComponent(targetId)}&secret=${encodeURIComponent(secret)}`;
    console.log(`📡 Sending delete request to live Vercel API for ID: ${targetId}...`);
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        console.error(`❌ Delete failed: ${data.error || 'Server error'}`);
        process.exit(1);
      }
      console.log(`✅ Successfully removed live review ID: ${targetId}`);
      console.log(`   Remaining live reviews: ${data.remaining}`);
    } catch (err) {
      console.error(`❌ Network error while deleting live review: ${err.message}`);
    }
    return;
  }

  console.log(`Unknown command: ${command}`);
  console.log('\nAvailable commands:');
  console.log('  Local:');
  console.log('    node manage-reviews.js list');
  console.log('    node manage-reviews.js delete <id>');
  console.log('    node manage-reviews.js clear');
  console.log('  Live Vercel:');
  console.log('    node manage-reviews.js live-list https://your-site.vercel.app');
  console.log('    node manage-reviews.js live-delete https://your-site.vercel.app <id> [admin_secret]');
}

main().catch(console.error);
