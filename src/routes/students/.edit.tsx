import { useState, useEffect } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StudentForm } from "@/features/students";
import { useAuth } from "@/hooks/useAuth";
import { getStudent } from "@/services/studentService";
import type { Student } from "@/types";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/students/$studentId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Student — InSuite" },
      { name: "description", content: "Update student details." },
    ],
  }),
  component: EditStudentPage,
});

function EditStudentPage() {
  const { studentId } = useParams({ from: "/students/$studentId/edit" });
  const { organization } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (organization) {
      getStudent(organization.id, studentId).then((data) => {
        setStudent(data);
        setIsLoading(false);
      });
    }
  }, [organization, studentId]);

  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Edit Student Profile">
        {isLoading ? (
          <div className="flex h-72 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <StudentForm initialStudent={student} />
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
