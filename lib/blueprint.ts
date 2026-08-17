export const blueprintLogo = "/assets/logogonzaga.png";
export const blueprintSearchIcon = "/blueprint/search_icon.png";
export const blueprintFeatureImage = "/assets/asset4.jpg";
export const blueprintCollageImage = "/assets/Background.jpg";

export const blueprintScenes = [
  {
    src: "/assets/asset5.jpg",
    alt: "Highland landscape in Gonzaga",
    eyebrow: "Highland escape"
  },
  {
    src: "/assets/asset6.jpg",
    alt: "Coastal rock formation in Gonzaga",
    eyebrow: "Coastal escape"
  },
  {
    src: "/assets/asset3.jpg",
    alt: "Riverside greenery and cabin view in Gonzaga",
    eyebrow: "Riverside stay"
  },
  {
    src: "/assets/asset2.jpg",
    alt: "Waterfall destination in Gonzaga",
    eyebrow: "Nature trail"
  },
  {
    src: "/assets/asset1.jpg",
    alt: "Seaside promenade in Gonzaga",
    eyebrow: "Seaside walk"
  }
] as const;

export function getBlueprintSceneBySeed(seed: string | null | undefined) {
  const basis = seed ?? "stabs";
  let total = 0;

  for (const character of basis) {
    total += character.charCodeAt(0);
  }

  return blueprintScenes[total % blueprintScenes.length];
}
