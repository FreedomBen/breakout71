import { GameState } from "./types";
import { icons } from "./loadGameData";
import { t } from "./i18n/i18n";
import { getSettingValue, setSettingValue } from "./settings";
import { asyncAlert } from "./asyncAlert";
import { openMainMenu } from "./game";

const publicKeyString = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAyGQJgs6gxa0Fd86TuZ2q
rGQ5ArSn8ug4VIKezru1QhIEkXeOT1lYXOLEryWaVUwXfOa9sVlKAGJY5y0TarAY
NF2m67ME8yzNPIoZWbKXutJ3CSCXNTjAqAxHgz7H+qxbNGZXAXw+ta8+PuZDzcCI
LbXT1u3/i0ahhA2Erdpv9XQBazKZt5AKzU31XhEEFh1jXZyk9D4XbatYXtvEwaJx
eSWmjSxJ6SJb6oH2mwm8V4E0PxYVIa0yX3cPgGuR0pZPMleOTc6o0T24I2AUQb0d
FckdFrr5U8bFIf/nwncMYVVNgt1vh88EuzWLjpc52nLrdOkVQNpiCN2uMgBBXQB7
iseIfdkGF0A4DBn8qdieDvaSY8zeRW/nAce4FNBidU1SebNRnIU9f/XpA493lJW+
Y/zXQBbmX/uSmeZDP4fjhKZv0Qa0ZeGzZiTdBKKb0BlIg/VYFFsqPytUVVyesO4J
RCASTIjXW61E7PQKir5qIXwkQDlzJ+bpZ3PHyAvspRrBaDxIYvEEw14evpuqOgS+
v/IlgPe+CWSvZa9xxnQl/aWZrOrD7syu6KKCbgUyXEm+Alp0YT3e6nwjn0qiM/cj
dZpWPx3O+rZbRQb0gHcvN4+n2Y7fWAeC9mxVZtADqvVr/GTumMbLj7DdhWtt1Ogu
4EcvkQ5SKCL0JC93DyctjOMCAwEAAQ==
-----END PUBLIC KEY-----`;

function pemToArrayBuffer(pem: string) {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s+/g, "");
  const binaryDerString = atob(b64);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }
  return binaryDer.buffer;
}

async function getPriceId(key: string, pem: string) {
  // Split the key into its components
  const [priceId, timestamp, signature] = key.split(":");
  const data = `${priceId}:${timestamp}`;

  const publicKeyBuffer = pemToArrayBuffer(pem);

  const publicKey = await crypto.subtle.importKey(
    "spki",
    publicKeyBuffer,
    {
      name: "RSA-PSS",
      hash: "SHA-256",
    },
    true,
    ["verify"],
  );

  // Verify the signature using ECDSA
  const isValid = await crypto.subtle.verify(
    {
      name: "RSA-PSS",
      saltLength: 32,
    },
    publicKey,
    new Uint8Array(Array.from(atob(signature), (c) => c.charCodeAt(0))),
    new TextEncoder().encode(data),
  );
  if (!isValid) throw new Error("Invalid key signature");

  return priceId;
}

let premium = false;
const gamePriceId = "price_1R6YaEGRf74lr2EkSo2GPvuO";
checkKey(getSettingValue("license", "")).then();

async function checkKey(key: string) {
  if (!key) return "No key";
  try {
    if (gamePriceId !== (await getPriceId(key, publicKeyString))) {
      return "Wrong product";
    }
    premium = true;
    return "";
  } catch (e) {
    return "Could not upgrade : " + e.message;
  }
}

export function isPremium() {
  return premium;
}

export function premiumMenuEntry(gameState: GameState) {
  if (isPremium()) {
    return {
      icon: icons["icon:premium_active"],
      text: t("premium.thanks"),
      help: t("premium.thanks_help"),
      value: async () => {
        navigator.clipboard.writeText(getSettingValue("license", ""));
        openMainMenu();
      },
    };
  }

  let text = t("premium.title");
  let help = t("premium.buy");
  try {
    const timePlayed = localStorage.getItem("breakout_71_total_play_time");
    if (timePlayed && !isGooglePlayInstall) {
      const hours = parseFloat(timePlayed) / 1000 / 60 / 60;
      const pricePerHours = 4.99 / hours;
      const args = {
        hours: Math.floor(hours),
        pricePerHours: pricePerHours.toFixed(2),
      };
      if (pricePerHours > 0 && pricePerHours < 0.5) {
        text = t("premium.per_hours", args);
        help = t("premium.per_hours_help", args);
      }
    }
  } catch (e) {
    console.warn(e);
  }

  return {
    icon: icons["icon:premium"],
    text,
    help,
    value: () => openPremiumMenu(""),
  };
}

const isGooglePlayInstall =
  new URLSearchParams(location.search).get("source") === "com.android.vending";

async function openPremiumMenu(text) {
  const cb = await asyncAlert({
    title: t("premium.title"),
    content: [
      text ||
        (isGooglePlayInstall && t("premium.help_google")) ||
        t("premium.help"),
      {
        text: t("premium.buy"),
        disabled: isGooglePlayInstall,
        help: isGooglePlayInstall
          ? t("premium.buy_disabled_help")
          : t("premium.buy_help"),
        value() {
          window.open(
            "https://licenses.lecaro.me/buy/price_1R6YaEGRf74lr2EkSo2GPvuO",
            "_blank",
          );
        },
      },
      {
        text: t("premium.enter"),
        help: t("premium.enter_help"),
        async value() {
          const value = (
            prompt("Please paste your license key") || ""
          )?.replace(/\s+/g, "");

          const problem = await checkKey(value || "");
          if (problem) {
            openPremiumMenu(problem).then();
          } else {
            setSettingValue("license", value);
            openMainMenu().then();
          }
        },
      },
      {
        text: t("premium.back"),
        help: t("premium.back_help"),
        value() {
          openMainMenu().then();
        },
      },
    ],
  });
  if (cb) cb();
}
