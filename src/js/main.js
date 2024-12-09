import { geminiApi } from './api.js';
import { ui } from './ui.js';
import { showNotification } from './utils.js';

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Main: 初期化開始');

    try {
        // ローカルストレージからAPI Keyを復元
        const savedApiKey = localStorage.getItem('geminiApiKey');
        if (savedApiKey) {
            console.log('Main: 保存済みAPI Keyを復元');
            document.getElementById('api-key').value = savedApiKey;
            geminiApi.setApiKey(savedApiKey);
            showNotification('API Keyを復元しました', 'info');
        }

        console.log('Main: 初期化完了');
    } catch (error) {
        console.error('Main: 初期化エラー:', error);
        showNotification('初期化中にエラーが発生しました', 'error');
    }
}); 