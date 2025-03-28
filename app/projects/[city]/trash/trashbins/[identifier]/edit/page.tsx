"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import PageTitle from "@/components/PageTitle";
import { Button } from "@/components/ui/button";
import LoadingComponent from "@/components/LoadingComponent";
import { Info } from "lucide-react";
import { useTranslation } from '@/lib/TranslationContext';
import { useRouter } from "next/navigation";


const EditTrashbinPage = ({ params }: { params: { identifier: string } }) => {
  type TrashBinUpdate = {
    _id: string;
    identifier: string;
    coordinates: [number | null, number | null];
    location: string;
    name: string;
    image: string;
  };
  const [trashbin, setTrashbin] = useState<TrashBinUpdate | null>(null);
  const [errors, setErrors] = useState({ name: "", coordinates: "", location: "", image: "" });
  const { t } = useTranslation();  
  const router = useRouter(); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(
          `/api/v1/trashbin/${params.identifier}`,
          {
            headers: {
              Authorization: `Bearer ${token?.replace(/"/g, "")}`,
            },
          }
        );

        setTrashbin(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push('/login');
        }
      }
    };

    fetchData();
  }, [params.identifier,router]);

  const goBack = () => {
    window.history.back();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trashbin) return;

    // Validate all fields
    let isValid = true;
    let newErrors = { name: "", coordinates: "", location: "", image: "" };

    // Check name
    if (trashbin.name === "") {
      isValid = false;
      newErrors.name = "Name cannot be empty.";
    }

    // Check coordinates
    try {
      const lat = parseFloat(trashbin.coordinates[0]?.toString() || "0");
      const lng = parseFloat(trashbin.coordinates[1]?.toString() || "0");
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        isValid = false;
        newErrors.coordinates =
          "Coordinates must be valid latitude (-90 to 90) and longitude (-180 to 180).";
      }
    } catch (error) {
      isValid = false;
      newErrors.coordinates = "Coordinates must be real numbers.";
    }

    // Check location
    // Currently nothing to check

    // Check image URL
    try {
      new URL(trashbin.image || "");
    } catch (err) {
      newErrors.image = "Image URL must be a valid URL.";
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    try {
      const token = localStorage.getItem("authToken");

      // Ensure coordinates are numbers
      const payload = {
        ...trashbin,
        latitude: parseFloat(trashbin.coordinates[0]?.toString() || "0"),
        longitude: parseFloat(trashbin.coordinates[1]?.toString() || "0"),
      };

      await axios.patch(
        `/api/v1/trashbin/${trashbin._id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token?.replace(/"/g, "")}`,
          },
        }
      );
      goBack();
    } catch (error) {
      console.error("Error updating data:", error);
    }
  };

  if (!trashbin) return <LoadingComponent />;

  return (
    <div className="flex flex-col gap-5 w-full">
      <PageTitle
  title={`${t("editTrashbin.title")} ${trashbin?.name || "Unknown"} (${trashbin?.identifier || "Unknown"})`}
/>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col">
          <label className="mb-1 text-lg">{t("editTrashbin.nameLabel")}</label>
          <input
            type="text"
            name="name"
            value={trashbin.name || ""}
            onChange={(e) => setTrashbin({ ...trashbin, name: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 w-[300px] mr-2"
          />
          {errors.name && <p className="text-red-500">{errors.name}</p>}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center justify-start">
            <label className="mb-1 text-lg">{t("editTrashbin.coordinatesLabel")}</label>
            <span className="text-blue-500 info-tooltip">
              <Info className="text-gray-500 ml-4 mr-2" />
              <span className="info-tooltip-text">
                {t("editTrashbin.coordinatesTooltip")}
              </span>
            </span>
          </div>
          <div className="flex">
            <input
              type="number"
              name="lat"
              value={trashbin.coordinates[0]?.toString() || ""}
              onChange={(e) =>
                setTrashbin({
                  ...trashbin,
                  coordinates: [
                    parseFloat(e.target.value),
                    trashbin.coordinates[1],
                  ],
                })
              }
              className="border border-gray-300 rounded px-3 py-2 w-[200px] mr-2"
              step="any"
            />
            <input
              type="number"
              name="lng"
              value={trashbin.coordinates[1]?.toString() || ""}
              onChange={(e) =>
                setTrashbin({
                  ...trashbin,
                  coordinates: [
                    trashbin.coordinates[0],
                    parseFloat(e.target.value),
                  ],
                })
              }
              className="border border-gray-300 rounded px-3 py-2 w-[200px] mr-2"
              step="any"
            />
          </div>
          {errors.coordinates && (
            <p className="text-red-500">{errors.coordinates}</p>
          )}
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-lg">{t("editTrashbin.locationLabel")}</label>
          <input
            type="text"
            name="location"
            value={trashbin.location || ""}
            onChange={(e) =>
              setTrashbin({ ...trashbin, location: e.target.value })
            }
            className="border border-gray-300 rounded px-3 py-2 w-[300px] mr-2"
          />
          {errors.location && <p className="text-red-500">{errors.location}</p>}
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-lg">{t("editTrashbin.imageLabel")}</label>
          <input
            type="text"
            name="image"
            value={trashbin.image || ""}
            onChange={(e) =>
              setTrashbin({ ...trashbin, image: e.target.value })
            }
            className="border border-gray-300 rounded px-3 py-2 w-[600px] mr-2"
          />
          {errors.image && <p className="text-red-500">{errors.image}</p>}
        </div>
        <div className="flex gap-4">
          <Button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md w-[200px]"
          >
            {t("editTrashbin.saveButton")}
          </Button>
          <Button
            className="px-4 py-2 bg-red-600 text-white rounded-md w-[200px]"
            onClick={goBack}
          >
            {t("editTrashbin.cancelButton")}
          </Button>
        </div>
      </form>
    </div>
  );
};
export default EditTrashbinPage;
