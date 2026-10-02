import { UnifiedAsset } from '../types/unified-asset.js';

export interface AttributionFormats {
  plain: string;
  markdown: string;
  html: string;
  tasl: string;
}

export function generateAttributions(asset: UnifiedAsset): AttributionFormats {
  const title = asset.title || 'Untitled Work';
  const author = asset.author_name || 'Anonymous';
  const authorUrl = asset.author_url || asset.source_url;
  const sourceUrl = asset.source_url;
  const licenseName = asset.license_name;
  const licenseUrl = asset.license_url || 'https://creativecommons.org/';
  const providerName = asset.provider.charAt(0).toUpperCase() + asset.provider.slice(1);

  // TASL standard (Title, Author, Source, License)
  const tasl = `"${title}" by ${author}, available on ${providerName} (${sourceUrl}), licensed under ${licenseName} (${licenseUrl}).`;

  const plain = asset.attribution_text || `"${title}" by ${author} via ${providerName} · License: ${licenseName}`;

  const markdown = `"[${title}](${sourceUrl})" by [${author}](${authorUrl}) via [${providerName}](${sourceUrl}) is licensed under [${licenseName}](${licenseUrl})`;

  const html = `<p><a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">"${title}"</a> by <a href="${authorUrl}" target="_blank" rel="noopener noreferrer">${author}</a> via <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">${providerName}</a> is licensed under <a href="${licenseUrl}" target="_blank" rel="noopener noreferrer">${licenseName}</a>.</p>`;

  return {
    plain,
    markdown,
    html,
    tasl
  };
}
