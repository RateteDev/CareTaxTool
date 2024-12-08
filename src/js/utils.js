/**
 * エラーメッセージを表示する
 * @param {string} message - エラーメッセージ
 */
function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.add('visible');
    setTimeout(() => {
        errorElement.classList.remove('visible');
    }, 5000);
}

/**
 * ファイルを画像URLに変換する
 * @param {File} file - 画像ファイル
 * @returns {Promise<string>} - 画像のData URL
 */
function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * JSONデータをクリップボードにコピーする
 * @param {Object} data - コピーするJSONデータ
 */
function copyToClipboard(data) {
    const textArea = document.createElement('textarea');
    textArea.value = JSON.stringify(data, null, 2);
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
}

/**
 * 日付を標準フォーマットに変換する
 * @param {string} dateStr - 日付文字列
 * @returns {string} - YYYY-MM-DD形式の日付
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
}

/**
 * 金額文字列を数値に変換する
 * @param {string} amountStr - 金額文字列
 * @returns {number} - 数値化された金額
 */
function parseAmount(amountStr) {
    return parseInt(amountStr.replace(/[^0-9]/g, ''), 10);
} 