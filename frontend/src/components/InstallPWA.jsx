import { useState, useEffect } from 'react';

function InstallPWA() {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [promptInstall, setPromptInstall] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            setPromptInstall(e);
            setSupportsPWA(true);
        };
        
        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleClick = async () => {
        if (!promptInstall) {
            return;
        }
        // Show the install prompt
        promptInstall.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await promptInstall.userChoice;
        // Clear the prompt
        setPromptInstall(null);
    };

    if (!supportsPWA) {
        return null;
    }

    return (
        <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            onClick={handleClick}
        >
            Install App
        </button>
    );
}

export default InstallPWA; 