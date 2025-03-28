"use client";

import { useEffect, useState } from "react";
import axios from "axios";;
import PageTitle from "@/components/PageTitle";
import { Button } from "@/components/ui/button";
import LoadingComponent from "@/components/LoadingComponent";
import { useTranslation } from "@/lib/TranslationContext"; // Import translation hook
import { useRouter } from "next/navigation";

interface Project {
  _id: string;
  identifier: string;
  name: string;
  projectType: string;
  cityName: string;
}

function removeProjectDataLocally() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("projectId");
    localStorage.removeItem("cityName");
    localStorage.removeItem("projectType");
  }
}

function saveProjectDataLocally(project: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("projectId", project.id);
    localStorage.setItem("cityName", project.cityName);
    localStorage.setItem("projectType", project.projectType);
  }
}

export default function Projects() {
  const { t } = useTranslation(); // Use translation hook for localization
  const [projectData, setProjectData] = useState<Project[] | null>(null);
  const router = useRouter();

  // Remove any project data that might be stored locally when navigating back to the projects page
  removeProjectDataLocally();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");

        const response = await axios.get(
          `/api/v1/project`,
          {
            headers: {
              Authorization: `Bearer ${token?.replace(/"/g, "")}`,
            },
          }
        );

        const projects = response.data.projects;

        const transformedData = projects.map((item: any) => ({
          id: item._id,
          identifier: item.identifier,
          name: item.name,
          projectType: item.projectType.toLowerCase(),
          cityName: item.city.name.toLowerCase(),
        }));

        setProjectData(transformedData);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push('/login');
        } else {
          console.error("Error fetching data:", error);
        }
      }
    };
    fetchData();
  }, [router]);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Translated title */}
      <PageTitle title={t("menu.Your Projects")} />
      {!projectData ? (
        <LoadingComponent text={t("Loading projects...")} />
      ) : (
        <section className="grid grid-cols-1 gap-4 transition-all lg:grid-cols-3">
          {projectData.map((project) => (
            <Button
              variant="outline"
              onClick={() => {
                saveProjectDataLocally(project);
                window.location.href = `/projects/${project.cityName}/${project.projectType}`;
              }}
              key={project.identifier}
            >
              <span className="text-2xl">{project.name}</span>
            </Button>
          ))}
        </section>
      )}
    </div>
  );
}
