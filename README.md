# About

Hymnos is an app that enable Church services to present Hymns or any Liturgical text during praying. It is designed to be cross-platform as a PWA app built with [React-Native (expo)](https://expo.dev/).

# Usage

Make sure you have Python, Nodejs and npm install on your system. Please refer to [NodeJs](https://www.npmjs.com/) and [Python](https://www.python.org/)

## Frontend

- Go inside the `frontend/` folder using `cd frontend/`.
- Run `npm install`.
- Run `npx expo start`.
- Navigate to `localhost:8081` to see the app. You can also install the [Expo Go](https://expo.dev/go) app on your mobile and scan the QR code you see on the terminal to run the app.

### Technologies used

- [**zustand**](https://github.com/pmndrs/zustand): global state managment.
- [**expo-fonts**](https://docs.expo.dev/versions/latest/sdk/font/): utilizing Google fonts inside the app.
- [**nativewind**](https://www.nativewind.dev/): cross-platform styling using [tailwindcss](https://tailwindcss.com/).
- [**Dexie.js**](https://github.com/AlaSQL/alasql): library for managing IndexedDB database that could be used in a cross-platform way (PWA).

## Backend

Backend is built using Python and [fastapi](https://fastapi.tiangolo.com/) for designing a simple API. `uv` is used to manage depenedncies.

- Install `uv` using `curl -LsSf https://astral.sh/uv/install.sh | sh` for linux or `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"` for windows.
- Serve the backend API by running `uv run fastapi dev src/main.py` inside the `backend/` folder.
- In your browser navigate to `http://127.0.0.1:8000/docs` for the Swagger docs.
