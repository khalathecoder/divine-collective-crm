interface TeamRow {
  name: string;
  role: string;
  crmArea: string;
  howItGetsIn: string;
}

const TEAM: TeamRow[] = [
  {
    name: "Aaron — Business Coach",
    role: "Pricing, offers, packaging, launch strategy, revenue goals.",
    crmArea: "Programs & Pricing, Dashboard (revenue)",
    howItGetsIn: "His recommendations become the price, name, and description you type into a Program.",
  },
  {
    name: "Cody — Copywriter",
    role: "Sales pages, program descriptions, headlines, CTAs.",
    crmArea: "Programs & Pricing (description), Email Funnels (subject/body), Surveys (question wording)",
    howItGetsIn: "Paste his copy into a Program's description or a Funnel step's subject/body.",
  },
  {
    name: "Mark — Launch Specialist",
    role: "Rollout timeline, campaign calendar, countdown, asset checklist.",
    crmArea: "Email Funnels (step timing), Calendar (blocking/opening dates around launch day)",
    howItGetsIn: "His timeline sets the \"send this many hours after...\" delays on each Funnel step.",
  },
  {
    name: "Angelina — Translator",
    role: "Translates content into other languages.",
    crmArea: "Email Funnels, Surveys",
    howItGetsIn: "Create a second Funnel or Survey with her translated copy for a Spanish-speaking segment.",
  },
  {
    name: "Dolly — Graphic Designer",
    role: "Social graphics, email banners, quote cards.",
    crmArea: "Email Funnels (images embedded in the HTML body)",
    howItGetsIn: "Host her image somewhere public and drop an <img> tag into a Funnel step's body.",
  },
  {
    name: "Frannie — Feedback Coach",
    role: "Reviews writing for clarity and tone before it goes out.",
    crmArea: "Quality check for Email Funnels and Surveys before you mark them Active",
    howItGetsIn: "Have her review a Funnel step's copy or a Survey's questions before you publish them.",
  },
  {
    name: "Jerry — Press Releases",
    role: "Media announcements, press kits, launch news.",
    crmArea: "Contacts (new leads tagged with source \"press\")",
    howItGetsIn: "Coverage drives people to your website, which reports them to Contacts automatically.",
  },
  {
    name: "Maya — Course Creator",
    role: "Builds the actual course, workbook, and slide content.",
    crmArea: "What a Program delivers; referenced in post-purchase Funnel steps",
    howItGetsIn: "Link her workbook/course in the Funnel email that goes out after purchase.",
  },
  {
    name: "Vicky — Viral Scripter",
    role: "Short-form video scripts and hooks.",
    crmArea: "Contacts (new leads tagged with source \"social\")",
    howItGetsIn: "Video drives traffic to your booking page or a lead magnet, which creates a Contact.",
  },
  {
    name: "Patty — Email Marketing",
    role: "Writes email sequences and marketing campaigns (previously built around GoHighLevel).",
    crmArea: "Email Funnels — this is now her main workspace",
    howItGetsIn: "Her sequences become the steps in a Funnel here, replacing GoHighLevel's email tool.",
  },
];

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Your Team</h1>
      <p className="max-w-3xl text-sm text-gray-500">
        These skills don't log into the CRM themselves — they write the content. You (or a Claude Code
        session working on your behalf, using an API key from the API Keys page) are the one who puts
        their work into a Program, Funnel, or Survey below. This table is just a map of who feeds what.
      </p>

      <div className="card overflow-hidden !p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Who</th>
              <th className="px-4 py-3">What they do</th>
              <th className="px-4 py-3">Feeds into</th>
              <th className="px-4 py-3">How it gets in</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {TEAM.map((row) => (
              <tr key={row.name}>
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3 text-gray-600">{row.role}</td>
                <td className="px-4 py-3 text-gray-600">{row.crmArea}</td>
                <td className="px-4 py-3 text-gray-500">{row.howItGetsIn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
