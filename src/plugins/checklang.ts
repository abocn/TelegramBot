const languageFiles = {
  'pt': '../locales/portuguese.json',
  'pt-br': '../locales/portuguese.json',
  'pt-pt': '../locales/portuguese.json',
  'en': '../locales/english.json',
  'en-us': '../locales/english.json',
  'en-gb': '../locales/english.json'
};

function getStrings(languageCode: string) {
  const filePath: string = languageFiles[languageCode] || languageFiles['en'];
  try {
    return require(filePath);
  } catch (error) {
    console.error(`Error loading language file for code ${languageCode}:`, error);
    return require(languageFiles['en']);
  }
}

export { getStrings };