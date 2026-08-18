import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section, SectionHeading } from "./Section";

const faqs = [
  {
    q: "What is InSuite?",
    a: "InSuite is a complete cloud-based school management platform that connects admissions, students, academics, attendance, fees, exams, communication and reporting in one system.",
  },
  {
    q: "Is InSuite suitable for small schools?",
    a: "Yes. The platform works for a single small campus and scales up to larger institutions and multi-branch groups without changing how you work.",
  },
  {
    q: "Can parents use InSuite?",
    a: "Parents get a dedicated portal where they can follow multiple children — attendance, fees, homework, timetable, exams, results, notices and documents.",
  },
  {
    q: "Can teachers manage attendance?",
    a: "Teachers mark student attendance for their assigned classes and periods, with present, absent, late and leave states, plus reports and automatic parent notifications.",
  },
  {
    q: "Can schools manage fees?",
    a: "Yes. You can define fee structures and installments, raise invoices, accept online or offline payments, handle partial payments, late fees, discounts, scholarships and receipts.",
  },
  {
    q: "Does it support multiple roles?",
    a: "InSuite supports school owners, principals, administrators, teachers, accountants, academic coordinators, parents and students, each with role-based access.",
  },
  {
    q: "Is student data isolated?",
    a: "The platform uses a multi-tenant architecture where each school's data is isolated, with permission-based access and audit logs inside the school itself.",
  },
  {
    q: "Can reports be exported?",
    a: "Reports across students, admissions, attendance, fee collection, defaulters and exam performance are designed to be viewed and exported for management use.",
  },
  {
    q: "Does it support online payments?",
    a: "Yes. Fee collection supports online and offline payments, with receipts generated automatically and reconciliation reflected in collection reports.",
  },
  {
    q: "Can the school customize branding?",
    a: "Each school can present the platform with its own identity, including branding applied to the school's portals and generated documents such as receipts and report cards.",
  },
];

export function Faq() {
  return (
    <Section id="faq">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading
          align="left"
          eyebrow="FAQ"
          title="Questions schools ask us"
          description="Still unsure about something? Book a demo and we'll walk through your school's workflow."
        />
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-[15px] font-semibold">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-[14px] leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
