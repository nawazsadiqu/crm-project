import DashboardLayout from "../pages/DashboardLayout";

const crmNavItems = [
  {
    label: "Dashboard",
    path: "/crm",
    icon: "🏠"
  },
  {
  label: "GMB Profile",
  path: "/crm/gmb-profile",
  icon: "📍"
  },
  {
    label: "Optimization",
    path: "/crm/optimization",
    icon: "⚙️"
  },
  {
  label: "Photoshoot",
  path: "/crm/photoshoot",
  icon: "📸"
  },
  {
  label: "Contact Number",
  path: "/crm/contact-number",
  icon: "📞"
 }, 
 {
  label: "Suspended Page",
  path: "/crm/suspended-page",
  icon: "🚫"
 },
 {
  label: "Page Handling",
  path: "/crm/page-handling",
  icon: "📄"
},
{
  label: "Other Services",
  path: "/crm/google-other-services",
  icon: "🧩"
},  
{
  label: "My Profile",
  path: "/crm/my-profile",
  icon: "👤"
}
];

const CrmLayout = () => {
  return (
    <DashboardLayout
      title="CRM Dashboard"
      subtitle="Manage CRM work, optimization records, and weekly updates"
      navItems={crmNavItems}
      basePath="/crm"
    />
  );
};

export default CrmLayout;