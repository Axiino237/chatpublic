export const getDeviceId = (): string => {
    let deviceId = localStorage.getItem('lovelink_device_id');
    if (!deviceId) {
        // Fallback for random ID generation without external dependencies
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('lovelink_device_id', deviceId);
    }
    return deviceId as string;
};

export const getDeviceType = (): string => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return 'mobile';
    }
    return 'desktop';
};
