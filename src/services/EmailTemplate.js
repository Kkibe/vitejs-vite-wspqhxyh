export class EmailTemplate {
  constructor(data) {
    this.username = data.username || 'Valued Member';
    this.date = data.date || new Date().toLocaleDateString();
    this.isPremium = data.isPremium || false;
    this.totalTips = data.totalTips || 0;
    this.todayMatches = data.todayMatches || 0;
    this.avgOdds = data.avgOdds || '1.5';
    this.confidenceRate = data.confidenceRate || 85;
    this.freeTips = data.freeTips || [];
    this.premiumTips = data.premiumTips || [];
    this.hasVipTips = data.hasVipTips || false;
    this.vipTipsCount = data.vipTipsCount || 0;
    this.proTip =
      data.proTip || 'Always compare odds across multiple bookmakers';
    this.tipsLink = data.tipsLink || 'https://powerking-tips.onrender.com/tips';
    this.upgradeLink =
      data.upgradeLink || 'https://powerking-tips.onrender.com/pay';
    this.unsubscribeLink = data.unsubscribeLink || '#';
    this.currentYear = new Date().getFullYear().toString();
  }

  render() {
    return `<!DOCTYPE html>...`; // Same HTML as above
  }
}

// Usage:
/*const template = new EmailTemplate({
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
  proTip: tipsData.proTip || 'Always compare odds across multiple bookmakers',
  tipsLink: 'https://powerking-tips.onrender.com/tips',
  upgradeLink: 'https://powerking-tips.onrender.com/pay',
  unsubscribeLink: `https://powerking-tips.onrender.com/unsubscribe/${user.email}`
});

const templateParams = {
  // ... other params
  html_content: template.render(),
  // ... other params
};
*/
