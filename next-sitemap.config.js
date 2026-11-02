/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://rissolab.stat.unipd.it",
  generateRobotsTxt: true,
  exclude: ["/ai-guidelines"],
};
