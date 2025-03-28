[![Netlify Status](https://api.netlify.com/api/v1/badges/2947cded-18ff-4548-ade1-f9cb067881b0/deploy-status)](https://app.netlify.com/sites/beamish-cendol-b3537c/deploys)

# TinyAIoT Dashboard

This is a frontend dashboard application for displaying information collected by IoT devices. It is built with the React framework [Next.js](https://nextjs.org/). For more detailed explanations, please take a look at our [wiki](https://github.com/tinyaiot-ps/frontend/wiki).


## Getting Started

To get a local copy running, follow these steps:

1. Clone the repository: `git clone git@github.com:TinyAIoT/trashcan-frontend.git`
2. Install [NodeJS](https://nodejs.org/en/download/)
3. Install the dependencies: `npm install`
4. Obtain the `.env` variables (-> cf. documentation)
5. Run the development server: `npm run dev`
6. Open http://localhost:3000 in the browser
7. The website auto-updates while editing the code

## Features/Subpages

- Dashboards for different kind of IoT devices: **Smart Trashcans** and Smart **Noise Sensors**
- Dashboard for **Smart Trashcans**
  - **Overview** page: Shows aggregated information: Which trashbins are on which fill and battery level, how many sensors are broken, etc.
  - **Map** page: Locations and detailed information of the trashbins
  - **Route Planning** page: Plan routes to empty trashbins, assign them to drivers and export them to Google Maps
  - **Trashbins (Overview)** page: Sort and search through the trashbins according to their attributes
  - **Trashbins (Detail)** page: View the history and detailed information for the selected trashbin
  - **Project Settings** page: Customize the UI to suit your needs
- Dashboard for **Smart Noise Sensor**
  - **Overview** page: Shows history of noise levels measured by the noise sensor and confidence of ML model
  - **Project Settings** page: Customize the UI to suit your needs
- **Login Page**: Login (TODO: Signup)
- **Account Settings**: Logout (TODO: Change password, theme, language)

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [shadcn/ui](https://ui.shadcn.com/docs)
- [Lucide Icons](https://lucide.dev/icons/)
- [axios](https://axios-http.com/)
