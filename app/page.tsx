import LetterExperience from "../components/LetterExperience";
import type { LetterData } from "../lib/letter";
import letterData from "../data/letter.json";
import { cookies } from "next/headers";
import { verifySession } from "../lib/session";

export default async function Home() {
  const passwordRequired = Boolean(process.env.LETTER_PASSWORD || process.env.ADMIN_PASSWORD);
  const jar = await cookies();
  const unlocked = verifySession(jar.get("letter_session")?.value, "letter");
  return <LetterExperience data={unlocked || !passwordRequired ? (letterData as LetterData) : null} passwordRequired={passwordRequired} initialUnlocked={unlocked} />;
}
