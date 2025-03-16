import _palette from "./data/palette.json";
import _rawLevelsList from "./data/levels.json";
import _appVersion from "./data/version.json";

describe("json data checks", () => {
  it("_rawLevelsList has icon levels", () => {
    expect(
      _rawLevelsList.filter((l) => l.name.startsWith("icon:")).length,
    ).toBeGreaterThan(10);
  });
  it("_rawLevelsList has non-icon few levels", () => {
    expect(
      _rawLevelsList.filter((l) => !l.name.startsWith("icon:")).length,
    ).toBeGreaterThan(10);
  });

  it("_rawLevelsList has max 5 colors per level", () => {
    const levelsWithManyBrickColors = _rawLevelsList
      .filter((l) => {
        const uniqueBricks = l.bricks
          .split("")
          .filter((b) => b !== "_" && b !== "black")
          .filter((a, b, c) => c.indexOf(a) === b);
        return uniqueBricks.length > 5;
      })
      .map((l) => l.name);
    expect(levelsWithManyBrickColors).toEqual([]);
  });
  it("Has a few colors", () => {
    expect(Object.keys(_palette).length).toBeGreaterThan(10);
  });
  it("Has an _appVersion", () => {
    expect(parseInt(_appVersion)).toBeGreaterThan(2000);
  });
});
