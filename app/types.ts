type Trashbin = {
  updatedAt: string | number | Date;
  _id: string;
  identifier: string;
  coordinates: [number, number];
  location: string;
  name: string;
  fillLevel: number;
  fillLevelChange: number;
  batteryLevel: number;
  signalStrength: number;
  image: string;
  lastEmptied: Date;
  sensors: string[];
};

export type { Trashbin };
