import emailjs from '@emailjs/browser';

// EmailJS configuration
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Initialize EmailJS
emailjs.init({ publicKey: PUBLIC_KEY });

// Template IDs
const TEMPLATES = {
  TIPS: import.meta.env.VITE_EMAILJS_TIPS_TEMPLATE,
  FEATURE: import.meta.env.VITE_EMAILJS_FEATURE_TEMPLATE,
  VIP: import.meta.env.VITE_EMAILJS_VIP_TEMPLATE,
  CUSTOM: import.meta.env.VITE_EMAILJS_CUSTOM_TEMPLATE,
};

// Import HTML as raw string using ?raw
import tipsTemplate from '../email-templates/tips1.html?raw';

export const emailService = {
  /*async sendTipsEmailWithHTML(user, templateData) {
    // Clone the template
    let htmlContent = tipsTemplate;

    // Replace placeholders with actual data
    const replacements = {
      '{{username}}': user.username || user.email.split('@')[0],
      '{{email}}': user.email,
      '{{date}}': new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      '{{total_tips}}': templateData.totalTips || '0',
      '{{free_tips_count}}': templateData.freeTipsCount || '0',
      '{{vip_tips_count}}': templateData.vipTipsCount || '0',
      '{{today_matches}}': templateData.todayMatches || '0',
      '{{avg_odds}}': templateData.avgOdds || '1.5',
      '{{confidence_rate}}': templateData.confidenceRate || '85',
      '{{pro_tip}}': templateData.proTip || 'Always compare odds',
      '{{tips_link}}': 'https://powerking-tips.onrender.com/tips',
      '{{upgrade_link}}': 'https://powerking-tips.onrender.com/pay',
      '{{unsubscribe_link}}': `https://powerking-tips.onrender.com/unsubscribe/${user.email}`,
      '{{current_year}}': new Date().getFullYear().toString(),
    };

    // Apply all replacements
    Object.keys(replacements).forEach((key) => {
      htmlContent = htmlContent.replace(
        new RegExp(key, 'g'),
        replacements[key]
      );
    });

    // Handle conditional sections for premium users
    if (user.isPremium) {
      // Show premium content
      htmlContent = htmlContent.replace(
        /<!-- PREMIUM_START -->([\s\S]*?)<!-- PREMIUM_END -->/g,
        '$1'
      );
      // Hide free-only content
      htmlContent = htmlContent.replace(
        /<!-- FREE_START -->([\s\S]*?)<!-- FREE_END -->/g,
        ''
      );
    } else {
      // Show free content
      htmlContent = htmlContent.replace(
        /<!-- FREE_START -->([\s\S]*?)<!-- FREE_END -->/g,
        '$1'
      );
      // Hide premium content
      htmlContent = htmlContent.replace(
        /<!-- PREMIUM_START -->([\s\S]*?)<!-- PREMIUM_END -->/g,
        ''
      );
    }

    // Build tips tables
    const freeTipsTable = buildTipsTable(templateData.freeTips, false);
    const premiumTipsTable = buildTipsTable(templateData.premiumTips, true);

    htmlContent = htmlContent
      .replace('{{free_tips_table}}', freeTipsTable)
      .replace('{{premium_tips_table}}', premiumTipsTable);

    const templateParams = {
      to_email: user.email,
      to_name: user.username || user.email.split('@')[0] || 'Valued Member',
      html_content: htmlContent,
      // These are for the EmailJS template subject line
      current_date: new Date().toLocaleDateString(),
      current_year: new Date().getFullYear().toString(),
      is_premium: user.isPremium ? 'true' : 'false',
      unsubscribe_link: `https://powerking-tips.onrender.com/unsubscribe/${user.email}`,
    };

    return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
  },*/

  async sendTipsEmailWithHTML(user, tipsData) {
    if (!user || !user.email) {
      return { success: false, error: 'User has no email address' };
    }

    const isUserPremium = user.isPremium === true;
    const formattedDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Fetch the HTML template at runtime
    const response = await fetch('/email-templates/tips1.html');
    let htmlContent = await response.text();

    // Start with the template
    //let htmlContent = tipsTemplate;

    // Replace all placeholders
    htmlContent = htmlContent
      // User Info
      .replace(
        /\{\{username\}\}/g,
        user.username || user.email?.split('@')[0] || 'Valued Member'
      )
      .replace(
        /\{\{to_name\}\}/g,
        user.username || user.email?.split('@')[0] || 'Valued Member'
      )
      .replace(/\{\{email\}\}/g, user.email)
      .replace(/\{\{to_email\}\}/g, user.email)

      // Date Info
      .replace(/\{\{date\}\}/g, formattedDate)
      .replace(/\{\{current_date\}\}/g, formattedDate)
      .replace(/\{\{current_year\}\}/g, new Date().getFullYear().toString())

      // Tips Stats
      .replace(/\{\{total_tips\}\}/g, tipsData.totalTips?.toString() || '0')
      .replace(
        /\{\{free_tips_count\}\}/g,
        tipsData.freeTipsCount?.toString() || '0'
      )
      .replace(
        /\{\{vip_tips_count\}\}/g,
        tipsData.vipTipsCount?.toString() || '0'
      )
      .replace(
        /\{\{today_matches\}\}/g,
        tipsData.todayMatches?.toString() || '0'
      )
      .replace(/\{\{avg_odds\}\}/g, tipsData.avgOdds || '1.5')
      .replace(
        /\{\{confidence_rate\}\}/g,
        tipsData.confidenceRate?.toString() || '85'
      )

      // Pro Tip
      .replace(
        /\{\{pro_tip\}\}/g,
        tipsData.proTip || 'Always compare odds across multiple bookmakers'
      )

      // User Type
      .replace(/\{\{is_premium\}\}/g, isUserPremium ? 'true' : 'false')
      .replace(/\{\{has_vip_tips\}\}/g, tipsData.hasVipTips ? 'true' : 'false')

      // Links
      .replace(/\{\{tips_link\}\}/g, 'https://powerking-tips.onrender.com/tips')
      .replace(
        /\{\{upgrade_link\}\}/g,
        'https://powerking-tips.onrender.com/pay'
      )
      .replace(
        /\{\{unsubscribe_link\}\}/g,
        `https://powerking-tips.onrender.com/unsubscribe/${user.email}`
      )

      // Tips Tables
      .replace(
        /\{\{free_tips_table\}\}/g,
        this.buildTipsTable(tipsData.freeTips, false)
      )
      .replace(
        /\{\{premium_tips_table\}\}/g,
        this.buildTipsTable(tipsData.premiumTips, true)
      );

    // Handle conditional content for free vs premium users
    if (isUserPremium) {
      // Show premium content, hide free-only content
      htmlContent = htmlContent
        .replace(/<!-- PREMIUM_START -->/g, '')
        .replace(/<!-- PREMIUM_END -->/g, '')
        .replace(/<!-- FREE_START -->([\s\S]*?)<!-- FREE_END -->/g, '');
    } else {
      // Show free content, hide premium content
      htmlContent = htmlContent
        .replace(/<!-- FREE_START -->/g, '')
        .replace(/<!-- FREE_END -->/g, '')
        .replace(/<!-- PREMIUM_START -->([\s\S]*?)<!-- PREMIUM_END -->/g, '');
    }

    // EmailJS template parameters
    const templateParams = {
      to_email: user.email,
      to_name: user.username || user.email?.split('@')[0] || 'Valued Member',
      html_content: htmlContent,
      current_date: formattedDate,
      current_year: new Date().getFullYear().toString(),
      is_premium: isUserPremium ? 'true' : 'false',
      unsubscribe_link: `https://powerking-tips.onrender.com/unsubscribe/${user.email}`,
    };

    console.log(`📧 Sending email to: ${user.email}`);

    try {
      const response = await emailjs.send(
        SERVICE_ID,
        TEMPLATES.TIPS,
        templateParams
      );
      return { success: true, response };
    } catch (err) {
      console.error(`❌ Failed to send to ${user.email}:`, err);
      return { success: false, error: err.text || err.message };
    }
  },

  /**
   * Send tips email to a user
   */
  async sendTipsEmail(user, tipsData) {
    const isUserPremium = user.isPremium === true;
    const formattedDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Format tips for JSON display
    const formatTipsForJSON = (tips) => {
      if (!tips || tips.length === 0) return '';
      return JSON.stringify(
        tips.map((tip) => ({
          home: tip.home || 'Team A',
          away: tip.away || 'Team B',
          league: tip.league || 'Major League',
          time: tip.time || 'TBD',
          pick: tip.pick || 'Home Win',
          odd: tip.odd || '1.00',
        }))
      );
    };

    /*const templateParams = {
      // User info
      username: user.username || user.email?.split('@')[0] || 'Valued Member',
      to_name: user.username || user.email?.split('@')[0] || 'Valued Member',
      email: user.email,
      to_email: user.email,
      date: formattedDate,
      current_date: formattedDate,
      current_year: new Date().getFullYear().toString(),

      subject: `⚽ Today's Tips Are Live - ${new Date().toLocaleDateString()}`,
      html_content: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Today's Tips - PowerKing Tips</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: linear-gradient(135deg, #00ae58 0%, #007a37 100%);
        padding: 30px 20px;
        text-align: center;
        position: relative;
      }
      .logo {
        font-size: 28px;
        font-weight: bold;
        color: #ffffff;
        text-decoration: none;
      }
      .premium-banner {
        background: rgba(255, 215, 0, 0.2);
        border: 1px solid #ffd700;
        border-radius: 8px;
        padding: 10px 15px;
        margin-top: 15px;
        display: inline-block;
        color: #ffd700;
        font-weight: bold;
        font-size: 14px;
      }
      .content {
        padding: 30px;
      }
      .content h2 {
        color: #00ae58;
        margin-top: 0;
      }
      .content p {
        color: #333;
        line-height: 1.6;
      }
      .tips-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 14px;
      }
      .tips-table th {
        background: #00ae58;
        color: white;
        padding: 12px;
        text-align: left;
        font-weight: 600;
      }
      .tips-table td {
        padding: 10px;
        border-bottom: 1px solid #eee;
        color: #333;
      }
      .tips-table tr:nth-child(even) {
        background: #f9f9f9;
      }
      .tips-table tr:hover {
        background: #f0f7f0;
      }
      .premium-badge {
        background: #ffd700;
        color: #333;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: bold;
        display: inline-block;
      }
      .free-badge {
        background: #e0e0e0;
        color: #666;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: bold;
        display: inline-block;
      }
      .match-time {
        font-size: 11px;
        color: #888;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 15px;
        margin: 20px 0;
        background: #f5f5f5;
        padding: 20px;
        border-radius: 12px;
      }
      .stat-item {
        text-align: center;
      }
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #00ae58;
      }
      .stat-label {
        font-size: 12px;
        color: #888;
        margin-top: 4px;
      }
      .btn {
        display: inline-block;
        background: linear-gradient(135deg, #00ae58 0%, #007a37 100%);
        color: white !important;
        padding: 12px 30px;
        text-decoration: none !important;
        border-radius: 25px;
        margin: 10px 5px;
        font-weight: 600;
        text-align: center;
      }
      .btn-dark {
        background: #333;
      }
      .vip-upgrade {
        background: linear-gradient(135deg, #ffd700, #ffa500);
        padding: 25px;
        border-radius: 12px;
        text-align: center;
        margin: 20px 0;
      }
      .vip-upgrade strong {
        font-size: 18px;
        color: #333;
      }
      .vip-upgrade p {
        color: #555;
      }
      .vip-upgrade .btn {
        background: #333;
        margin-top: 10px;
      }
      .footer {
        background: #f5f5f5;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #666;
      }
      .footer a {
        color: #00ae58;
        text-decoration: none;
      }
      .pro-tip-box {
        background: #e8f5e9;
        border-left: 4px solid #00ae58;
        padding: 15px 20px;
        border-radius: 8px;
        margin: 20px 0;
      }
      .pro-tip-box strong {
        color: #00ae58;
      }
      .no-tips {
        text-align: center;
        padding: 30px;
        color: #888;
        background: #f9f9f9;
        border-radius: 8px;
      }
      @media (max-width: 480px) {
        .tips-table {
          font-size: 12px;
        }
        .tips-table th,
        .tips-table td {
          padding: 8px 6px;
        }
        .stats-grid {
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 15px;
        }
        .content {
          padding: 20px;
        }
        .btn {
          padding: 10px 20px;
          font-size: 14px;
          display: block;
          text-align: center;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="logo">⚡ PowerKing Tips</div>

        ${
          isPremium
            ? '<div class="premium-banner">⭐ PREMIUM MEMBER - Full Access ⭐</div>'
            : ''
        }
      </div>

      <!-- Content -->
      <div class="content">
        <h2>⚽ Today's Tips Are Live!</h2>
        <p>Hello ${username},</p>
        <p>
          Our expert analysts have posted today's betting tips for
          <strong>${date}</strong>.
        </p>

        <!-- Stats Summary -->
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">${totalTips}</div>
            <div class="stat-label">🎯 Predictions</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${todayMatches}</div>
            <div class="stat-label">⚽ Matches</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${avgOdds}</div>
            <div class="stat-label">💰 Avg Odds</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${confidenceRate}%</div>
            <div class="stat-label">📈 Confidence</div>
          </div>
        </div>

        <!-- Free Tips Section -->
        ${
          freeTips && freeTips.length > 0
            ? `
        <h3>🔥 Free Predictions</h3>
        <table class="tips-table">
          <thead>
            <tr>
              <th>Match</th>
              <th>Tip</th>
              <th>Odds</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            ${freeTips
              .map(
                (tip) => `
            <tr>
              <td>
                <strong>${tip.home} vs ${tip.away}</strong>
                <br />
                <span class="match-time">🏆 ${tip.league} • ⏰ ${tip.time}</span>
              </td>
              <td>${tip.pick}</td>
              <td><strong>${tip.odd}</strong></td>
              <td><span class="free-badge">Free</span></td>
            </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        `
            : ''
        }

        <!-- Premium Tips Section (Only visible to premium users) -->
        ${
          isPremium && premiumTips && premiumTips.length > 0
            ? `
        <h3>⭐ VIP Exclusive Predictions</h3>
        <table class="tips-table">
          <thead>
            <tr>
              <th>Match</th>
              <th>Tip</th>
              <th>Odds</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            ${premiumTips
              .map(
                (tip) => `
            <tr>
              <td>
                <strong>${tip.home} vs ${tip.away}</strong>
                <br />
                <span class="match-time">🏆 ${tip.league} • ⏰ ${tip.time}</span>
              </td>
              <td>${tip.pick}</td>
              <td><strong>${tip.odd}</strong></td>
              <td><span class="premium-badge">⭐ VIP</span></td>
            </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        `
            : ''
        }

        <!-- Upgrade to VIP (For free users when VIP tips exist) -->
        ${
          !isPremium && hasVipTips
            ? `
        <div class="vip-upgrade">
          <strong>💎 Unlock VIP Predictions</strong>
          <p>
            Get access to <strong>${vipTipsCount}</strong> premium tips with
            higher odds and better returns.
          </p>
          <a href="${upgradeLink}" class="btn btn-dark">⭐ Upgrade to VIP →</a>
        </div>
        `
            : ''
        }

        <!-- Pro Tip -->
        <div class="pro-tip-box"><strong>💡 Pro Tip:</strong> ${proTip}</div>

        <!-- View All Tips Button -->
        <div style="text-align: center; margin: 20px 0">
          <a href="${tipsLink}" class="btn">📊 View All Tips →</a>
        </div>

        <p style="text-align: center; color: #666; font-style: italic">
          Best of luck with your bets!<br />
          <strong>The PowerKing Tips Team 🏆</strong>
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>© ${currentYear} PowerKing Tips. All rights reserved.</p>
        <p><a href="${unsubscribeLink}">Unsubscribe</a> from daily tips</p>
      </div>
    </div>
  </body>
</html>
`, //htmlContent, // The complete HTML
      from_name: 'PowerKing Tips',
      //reply_to: 'admin@crbloans.co.ke'
      reply_to: 'kkibetkkoir@gmail.com',

      // Tips data
      total_tips: tipsData.totalTips?.toString() || '0',
      free_tips_count: tipsData.freeTipsCount?.toString() || '0',
      vip_tips_count: tipsData.vipTipsCount?.toString() || '0',
      today_matches: tipsData.todayMatches?.toString() || '0',
      avg_odds: tipsData.avgOdds || '1.5',
      confidence_rate: tipsData.confidenceRate?.toString() || '85',
      pro_tip:
        tipsData.proTip || 'Always compare odds across multiple bookmakers',

      // User type
      is_premium: isUserPremium ? 'true' : 'false',
      has_vip_tips: tipsData.hasVipTips ? 'true' : 'false',

      // Tips data as JSON strings
      free_tips_json: formatTipsForJSON(tipsData.freeTips),
      premium_tips_json: formatTipsForJSON(tipsData.premiumTips),

      // Links
      tips_link: 'https://powerking-tips.onrender.com/tips',
      upgrade_link: 'https://powerking-tips.onrender.com/pay',
      unsubscribe_link: `https://powerking-tips.onrender.com/unsubscribe/${user.email}`,
    };*/

    /*const templateParams = {
      // User info
      username: user.username || user.email?.split('@')[0] || 'Valued Member',
      to_name: user.username || user.email?.split('@')[0] || 'Valued Member',
      email: user.email,
      to_email: user.email,
      date: formattedDate,
      current_date: formattedDate,
      current_year: new Date().getFullYear().toString(),

      subject: `⚽ Today's Tips Are Live - ${new Date().toLocaleDateString()}`,

      // Variables used in the HTML
      isPremium: isUserPremium,
      totalTips: tipsData.totalTips || 0,
      todayMatches: tipsData.todayMatches || 0,
      avgOdds: tipsData.avgOdds || '1.5',
      confidenceRate: tipsData.confidenceRate || 85,
      freeTips: tipsData.freeTips || [],
      premiumTips: tipsData.premiumTips || [],
      hasVipTips: tipsData.hasVipTips || false,
      vipTipsCount: tipsData.vipTipsCount || 0,
      proTip:
        tipsData.proTip || 'Always compare odds across multiple bookmakers',
      tipsLink: 'https://powerking-tips.onrender.com/tips',
      upgradeLink: 'https://powerking-tips.onrender.com/pay',
      unsubscribeLink: `https://powerking-tips.onrender.com/unsubscribe/${user.email}`,

      from_name: 'PowerKing Tips',
      reply_to: 'kkibetkkoir@gmail.com',

      // Legacy fields for compatibility
      is_premium: isUserPremium ? 'true' : 'false',
      has_vip_tips: tipsData.hasVipTips ? 'true' : 'false',
      free_tips_json: formatTipsForJSON(tipsData.freeTips),
      premium_tips_json: formatTipsForJSON(tipsData.premiumTips),

      html_content: `hey`,
    };*/

    // Helper function to render the HTML template
    function renderHTML({
      username,
      date,
      isPremium,
      totalTips,
      todayMatches,
      avgOdds,
      confidenceRate,
      freeTips,
      premiumTips,
      hasVipTips,
      vipTipsCount,
      proTip,
      tipsLink,
      upgradeLink,
      unsubscribeLink,
      currentYear,
    }) {
      return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Today's Tips - PowerKing Tips</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: linear-gradient(135deg, #00ae58 0%, #007a37 100%);
        padding: 30px 20px;
        text-align: center;
        position: relative;
      }
      .logo {
        font-size: 28px;
        font-weight: bold;
        color: #ffffff;
        text-decoration: none;
      }
      .premium-banner {
        background: rgba(255, 215, 0, 0.2);
        border: 1px solid #ffd700;
        border-radius: 8px;
        padding: 10px 15px;
        margin-top: 15px;
        display: inline-block;
        color: #ffd700;
        font-weight: bold;
        font-size: 14px;
      }
      .content {
        padding: 30px;
      }
      .content h2 {
        color: #00ae58;
        margin-top: 0;
      }
      .content p {
        color: #333;
        line-height: 1.6;
      }
      .tips-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 14px;
      }
      .tips-table th {
        background: #00ae58;
        color: white;
        padding: 12px;
        text-align: left;
        font-weight: 600;
      }
      .tips-table td {
        padding: 10px;
        border-bottom: 1px solid #eee;
        color: #333;
      }
      .tips-table tr:nth-child(even) {
        background: #f9f9f9;
      }
      .tips-table tr:hover {
        background: #f0f7f0;
      }
      .premium-badge {
        background: #ffd700;
        color: #333;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: bold;
        display: inline-block;
      }
      .free-badge {
        background: #e0e0e0;
        color: #666;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: bold;
        display: inline-block;
      }
      .match-time {
        font-size: 11px;
        color: #888;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 15px;
        margin: 20px 0;
        background: #f5f5f5;
        padding: 20px;
        border-radius: 12px;
      }
      .stat-item {
        text-align: center;
      }
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #00ae58;
      }
      .stat-label {
        font-size: 12px;
        color: #888;
        margin-top: 4px;
      }
      .btn {
        display: inline-block;
        background: linear-gradient(135deg, #00ae58 0%, #007a37 100%);
        color: white !important;
        padding: 12px 30px;
        text-decoration: none !important;
        border-radius: 25px;
        margin: 10px 5px;
        font-weight: 600;
        text-align: center;
      }
      .btn-dark {
        background: #333;
      }
      .vip-upgrade {
        background: linear-gradient(135deg, #ffd700, #ffa500);
        padding: 25px;
        border-radius: 12px;
        text-align: center;
        margin: 20px 0;
      }
      .vip-upgrade strong {
        font-size: 18px;
        color: #333;
      }
      .vip-upgrade p {
        color: #555;
      }
      .vip-upgrade .btn {
        background: #333;
        margin-top: 10px;
      }
      .footer {
        background: #f5f5f5;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #666;
      }
      .footer a {
        color: #00ae58;
        text-decoration: none;
      }
      .pro-tip-box {
        background: #e8f5e9;
        border-left: 4px solid #00ae58;
        padding: 15px 20px;
        border-radius: 8px;
        margin: 20px 0;
      }
      .pro-tip-box strong {
        color: #00ae58;
      }
      .no-tips {
        text-align: center;
        padding: 30px;
        color: #888;
        background: #f9f9f9;
        border-radius: 8px;
      }
      @media (max-width: 480px) {
        .tips-table {
          font-size: 12px;
        }
        .tips-table th,
        .tips-table td {
          padding: 8px 6px;
        }
        .stats-grid {
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 15px;
        }
        .content {
          padding: 20px;
        }
        .btn {
          padding: 10px 20px;
          font-size: 14px;
          display: block;
          text-align: center;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="logo">⚡ PowerKing Tips</div>

        ${
          isPremium
            ? '<div class="premium-banner">⭐ PREMIUM MEMBER - Full Access ⭐</div>'
            : ''
        }
      </div>

      <!-- Content -->
      <div class="content">
        <h2>⚽ Today's Tips Are Ready!</h2>
        <p>Hello ${username},</p>
        <p>
          Our expert analysts have posted today's betting tips for
          <strong>${date}</strong>.
        </p>

        <!-- Stats Summary -->
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">${totalTips}</div>
            <div class="stat-label">🎯 Predictions</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${todayMatches}</div>
            <div class="stat-label">⚽ Matches</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${avgOdds}</div>
            <div class="stat-label">💰 Avg Odds</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${confidenceRate}%</div>
            <div class="stat-label">📈 Confidence</div>
          </div>
        </div>

        <!-- Free Tips Section -->
        ${
          freeTips && freeTips.length > 0
            ? `
        <h3>🔥 Free Predictions</h3>
        <table class="tips-table">
          <thead>
            <tr>
              <th>Match</th>
              <th>Tip</th>
              <th>Odds</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            ${freeTips
              .map(
                (tip) => `
            <tr>
              <td>
                <strong>${tip.home} vs ${tip.away}</strong>
                <br />
                <span class="match-time">🏆 ${tip.league} • ⏰ ${tip.time}</span>
              </td>
              <td>${tip.pick}</td>
              <td><strong>${tip.odd}</strong></td>
              <td><span class="free-badge">Free</span></td>
            </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        `
            : ''
        }

        <!-- Premium Tips Section (Only visible to premium users) -->
        ${
          premiumTips && premiumTips.length > 0
            ? `
        <h3>⭐ VIP Exclusive Predictions</h3>
        <table class="tips-table">
          <thead>
            <tr>
              <th>Match</th>
              <th>Tip</th>
              <th>Odds</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            ${premiumTips
              .map(
                (tip) => `
            <tr>
              <td>
                <strong>${isPremium ? tip.home : 'home team hidden'} vs ${
                  isPremium ? tip.away : 'away team hidden'
                }</strong>
                <br />
                <span class="match-time"> ⏰ ${tip.time}</span>
              </td>
              <td>${tip.pick}</td>
              <td><strong>${tip.odd}</strong></td>
              <td><span class="premium-badge">⭐ VIP</span></td>
            </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        `
            : ''
        }

        <!-- Upgrade to VIP (For free users when VIP tips exist) -->
        ${
          !isPremium && hasVipTips
            ? `
        <div class="vip-upgrade">
          <strong>💎 Unlock VIP Predictions</strong>
          <p>
            Get access to <strong>${vipTipsCount}</strong> premium tips with
            higher odds and better returns.
          </p>
          <a href="${upgradeLink}" class="btn btn-dark">⭐ Upgrade to VIP →</a>
        </div>
        `
            : ''
        }

        <!-- Pro Tip -->
        <div class="pro-tip-box"><strong>💡 Pro Tip:</strong> ${proTip}</div>

        <!-- View All Tips Button -->
        <div style="text-align: center; margin: 20px 0">
          <a href="${tipsLink}" class="btn">📊 View All Tips →</a>
        </div>

        <p style="text-align: center; color: #666; font-style: italic">
          Best of luck with your bets!<br />
          <strong>The PowerKing Tips Team 🏆</strong>
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>© ${currentYear} PowerKing Tips. All rights reserved.</p>
        <p><a href="${unsubscribeLink}">Unsubscribe</a> from daily tips</p>
      </div>
    </div>
  </body>
</html>
  `;
    }

    // Then in your templateParams:
    const templateParams = {
      // User info
      username: user.username || user.email?.split('@')[0] || 'Valued Member',
      to_name: user.username || user.email?.split('@')[0] || 'Valued Member',
      email: user.email,
      to_email: user.email,
      date: formattedDate,
      current_date: formattedDate,
      current_year: new Date().getFullYear().toString(),

      subject: `⚽ Today's Tips Are Ready - ${new Date()
        .toLocaleDateString('en-GB')
        .replace(/\//g, '-')}`,

      html_content: renderHTML({
        username: user.username || user.email?.split('@')[0] || 'Valued Member',
        date: formattedDate,
        isPremium: isUserPremium,
        totalTips: tipsData.totalTips || 0,
        todayMatches: tipsData.todayMatches || 0,
        avgOdds: tipsData.avgOdds || '1.5',
        confidenceRate: tipsData.confidenceRate || 85,
        freeTips: tipsData.freeTips || [],
        premiumTips: tipsData.premiumTips || [],
        hasVipTips: tipsData.hasVipTips || false,
        vipTipsCount: tipsData.vipTipsCount || 0,
        proTip:
          tipsData.proTip || 'Always compare odds across multiple bookmakers',
        tipsLink: 'https://powerking-tips.onrender.com/tips',
        upgradeLink: 'https://powerking-tips.onrender.com/pay',
        unsubscribeLink: `https://powerking-tips.onrender.com/unsubscribe/${user.email}`,
        currentYear: new Date().getFullYear().toString(),
      }),

      from_name: 'PowerKing Tips',
      reply_to: 'kkibetkkoir@gmail.com',

      // Legacy fields for compatibility
      is_premium: isUserPremium ? 'true' : 'false',
      has_vip_tips: tipsData.hasVipTips ? 'true' : 'false',
      free_tips_json: formatTipsForJSON(tipsData.freeTips),
      premium_tips_json: formatTipsForJSON(tipsData.premiumTips),
    };

    try {
      const response = await emailjs.send(
        SERVICE_ID,
        TEMPLATES.TIPS /*TIPS_TEMPLATE_ID,*/,
        templateParams
      );
      console.log('Email sent successfully:', response);
      return { success: true, response };
    } catch (err) {
      console.error('EmailJS error:', err);
      return { success: false, error: err.text || err.message };
    }
  },

  /**
   * Send new feature email to a user
   */
  async sendFeatureEmail(user) {
    const templateParams = {
      to_email: user.email,
      to_name: user.username || user.email?.split('@')[0] || 'Valued Member',
      username: user.username || user.email?.split('@')[0] || 'Valued Member',
      email: user.email,
      dashboardLink: 'https://powerking-tips.onrender.com/',
      unsubscribe_link: `https://powerking-tips.onrender.com/unsubscribe/${user.email}`,
    };

    try {
      await emailjs.send(SERVICE_ID, TEMPLATES.FEATURE, templateParams);
      return { success: true };
    } catch (err) {
      console.error('EmailJS error:', err);
      return { success: false, error: err.text || err.message };
    }
  },

  /**
   * Send free VIP email to a user
   */
  async sendVIPEmail(user) {
    const templateParams = {
      to_email: user.email,
      to_name: user.username || user.email?.split('@')[0] || 'Valued Member',
      username: user.username || user.email?.split('@')[0] || 'Valued Member',
      email: user.email,
      claimLink: 'https://powerking-tips.onrender.com/pay',
      unsubscribe_link: `https://powerking-tips.onrender.com/unsubscribe/${user.email}`,
    };

    try {
      await emailjs.send(SERVICE_ID, TEMPLATES.VIP, templateParams);
      return { success: true };
    } catch (err) {
      console.error('EmailJS error:', err);
      return { success: false, error: err.text || err.message };
    }
  },

  /**
   * Send custom HTML email to a user
   */
  async sendCustomEmail(user, htmlContent, subject, attachments = []) {
    const templateParams = {
      to_email: user.email,
      to_name: user.username || user.email?.split('@')[0] || 'Valued Member',
      username: user.username || user.email?.split('@')[0] || 'Valued Member',
      email: user.email,
      html: htmlContent,
      subject: subject || 'Custom Email from PowerKing Tips',
      unsubscribe_link: `https://powerking-tips.onrender.com/unsubscribe/${user.email}`,
    };

    try {
      await emailjs.send(SERVICE_ID, TEMPLATES.CUSTOM, templateParams);
      return { success: true };
    } catch (err) {
      console.error('EmailJS error:', err);
      return { success: false, error: err.text || err.message };
    }
  },

  /**
   * Send bulk emails with progress tracking
   */
  async sendBulkEmails(users, sendFunction, onProgress) {
    let successCount = 0;
    let failCount = 0;
    const failedUsers = [];

    for (let i = 0; i < users.length; i++) {
      const result = await sendFunction(users[i]);

      if (result.success) {
        successCount++;
      } else {
        failCount++;
        failedUsers.push(users[i].email);
      }

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: users.length,
          successCount,
          failCount,
          failedUsers,
        });
      }

      // Delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return { successCount, failCount, failedUsers };
  },
};

// Helper function to build tips table
function buildTipsTable(tips, isPremium) {
  if (!tips || tips.length === 0) return '';

  const badgeClass = isPremium ? 'premium-badge' : 'free-badge';
  const badgeText = isPremium ? '⭐ VIP' : 'Free';

  let rows = tips
    .map(
      (tip) => `
    <tr>
      <td>
          <strong>${tip.home || 'Team A'}</strong> vs <strong>${
        tip.away || 'Team B'
      }</strong>
          <br />
          <span class="match-time"> ⏰ ${tip.time || 'TBD'}</span>
      </td>
      <td>${tip.pick || 'Home Win'}</td>
      <td>${tip.odd || '1.00'}</td>
      <td><span class="${badgeClass}">${badgeText}</span></td>
    </tr>
  `
    )
    .join('');

  return `
    <table class="tips-table">
      <thead>
        <tr>
          <th>Match</th>
          <th>Tip</th>
          <th>Odds</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

export default emailService;
