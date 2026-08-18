import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementBar, Navbar } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Problem } from "@/components/landing/Problem";
import { Features } from "@/components/landing/Features";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { Roles } from "@/components/landing/Roles";
import { Lifecycle } from "@/components/landing/Lifecycle";
import { Fees } from "@/components/landing/Fees";
import { Academics } from "@/components/landing/Academics";
import { Communication } from "@/components/landing/Communication";
import { Analytics } from "@/components/landing/Analytics";
import { Security, Automation, MobileReady } from "@/components/landing/Security";
import { Pricing, Testimonials } from "@/components/landing/Pricing";
import { SetupWizard } from "@/components/landing/SetupWizard";
import { Faq } from "@/components/landing/Faq";
import { FinalCta, Footer } from "@/components/landing/FinalCta";

const title = "InSuite — Complete School Management Platform & Intelligent ERP";
const description =
  "Run your entire school from one intelligent platform: admissions, students, attendance, fees, exams, teachers, parents, communication, and real-time reports.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: "/og-image.png" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Features />
        <ProductPreview />
        <Roles />
        <Lifecycle />
        <Fees />
        <Academics />
        <Communication />
        <Analytics />
        <SetupWizard />
        <Security />
        <Automation />
        <MobileReady />
        <Pricing />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
