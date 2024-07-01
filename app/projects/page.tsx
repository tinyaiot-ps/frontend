/** @format */
"use client";

import PageTitle from "@/components/PageTitle";
import { CardContent } from "@/components/Card";
import Link from 'next/link';
import { useEffect, useState } from "react";
import axios from "axios";

interface Project {
  _id: string;
  identifier: string;
  name: string;
  projectType: string;
  cityName: string;
}

function saveProjectDataLocally(project: any) {
  localStorage.setItem("projectId", project.id);
  localStorage.setItem("cityName", project.cityName);
  localStorage.setItem("projectType", project.projectType);
}

export default function Projects() {

  const [projectData, setProjectData] = useState<Project[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");

        const response = await axios.get(
          `http://localhost:${process.env.NEXT_PUBLIC_PORT}/api/v1/project`,
          {
            headers: {
              Authorization: `Bearer ${token?.replace(/"/g, "")}`,
            },
          }
        );

        const projects = response.data.projects;

        const transformedData = projects.map((item: any) => {
          return {
            id: item._id,
            identifier: item.identifier,
            name: item.name,
            projectType: item.projectType.toLowerCase(),
            cityName: item.city.name.toLowerCase(),
          };
        });

        setProjectData(transformedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-5 w-full">
      <PageTitle title="Your Projects" />
      <section className="grid grid-cols-1 gap-4 transition-all lg:grid-cols-3">
        {projectData.map((project) => (
          <Link
            href={`/projects/${project.cityName}/${project.projectType}`}
            key={project.identifier}
            onClick={() => saveProjectDataLocally(project)}
          >
              <CardContent>
                <p>
                  {project.name}
                  <span className="text-gray-500 ml-4">({project.identifier})</span>
                </p>
              </CardContent>
          </Link>
        ))}
      </section>
    </div>
  );
}
