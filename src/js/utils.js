/**
 * データをクリップボードにコピーする
 * @param {Object} data - コピーするデータ
 */
export function copyToClipboard(data) {
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
}

/**
 * エラーメッセージを表示する
 * @param {string} message - エラーメッセージ
 */
export function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    // 3秒後にメッセージを消す
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 3000);
}

/**
 * ファイルをBase64エンコードされたデータURLに変換する
 * @param {File} file - 変換するファイル
 * @returns {Promise<string>} - Base64エンコードされたデータURL
 */
export function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
        reader.readAsDataURL(file);
    });
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

/**
 * 通知を表示する
 * @param {string} message - 通知メッセージ
 * @param {string} type - 通知タイプ ('success' | 'error' | 'info')
 * @param {number} duration - 表示時間（ミリ秒）
 */
export function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, duration);
} 