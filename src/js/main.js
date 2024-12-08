// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    // ローカルストレージからAPI Keyを復元
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
        document.getElementById('api-key').value = savedApiKey;
        geminiApi.setApiKey(savedApiKey);
    }

    // API Keyの保存
    document.getElementById('api-key').addEventListener('change', (e) => {
        const apiKey = e.target.value;
        if (apiKey) {
            localStorage.setItem('geminiApiKey', apiKey);
        } else {
            localStorage.removeItem('geminiApiKey');
        }
    });

    // デバッグモード
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        console.log('デバッグモードで起動しています');
        window.debugGeminiApi = geminiApi;
        window.debugUI = ui;
    }
}); 