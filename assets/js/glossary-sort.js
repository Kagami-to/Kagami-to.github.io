function sortGlossaryRows(rows) {
  const lang = typeof getLanguage === 'function' ? getLanguage() : 'ja';
  return [...rows].sort((a, b) => {
    const primary = lang === 'en'
      ? String(a.term_en || a.term_ja || '')
      : String(a.reading_ja || a.term_ja || '');
    const secondary = lang === 'en'
      ? String(a.term_ja || a.reading_ja || '')
      : String(a.term_ja || a.term_en || '');
    const primaryB = lang === 'en'
      ? String(b.term_en || b.term_ja || '')
      : String(b.reading_ja || b.term_ja || '');
    const secondaryB = lang === 'en'
      ? String(b.term_ja || b.reading_ja || '')
      : String(b.term_ja || b.term_en || '');
    return primary.localeCompare(primaryB, lang === 'en' ? 'en' : 'ja')
      || secondary.localeCompare(secondaryB, lang === 'en' ? 'ja' : 'en')
      || String(a.term_id || '').localeCompare(String(b.term_id || ''));
  });
}
