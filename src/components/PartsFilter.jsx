import {useEffect, useRef, useState} from "react";
import {FormHelperText, IconButton, InputAdornment, InputLabel, Paper, styled, Tooltip} from "@mui/material";
import FormControl from "@mui/material/FormControl";
import OutlinedInput from "@mui/material/OutlinedInput";
import {Close, Mic, Stop} from "@mui/icons-material";

const Item = styled(Paper)(({theme}) => ({
    backgroundColor: '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: (theme.vars ?? theme).palette.text.secondary,
    ...theme.applyStyles('dark', {
        backgroundColor: '#1A2027',
    }),
}));

function PartsFilter({filterText, onFilterChange, onFilterTextChange, onClear}) {
    const recognitionRef = useRef(null);
    const [isListening, setIsListening] = useState(false);
    const [voiceError, setVoiceError] = useState('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isVoiceSupported = Boolean(SpeechRecognition);

    useEffect(() => () => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.abort();
        }
    }, []);

    const stopListening = () => {
        recognitionRef.current?.stop();
    };

    const startListening = () => {
        if (!SpeechRecognition || isListening) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'uk-UA';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setVoiceError('');
            setIsListening(true);
        };
        recognition.onresult = (event) => {
            const transcript = event.results[0]?.[0]?.transcript?.trim();
            if (transcript) {
                onFilterTextChange(transcript);
            }
        };
        recognition.onerror = (event) => {
            const messages = {
                'not-allowed': 'Доступ до мікрофона заборонено.',
                'audio-capture': 'Мікрофон не знайдено.',
                'no-speech': 'Мову не розпізнано. Спробуйте ще раз.',
                network: 'Для розпізнавання голосу потрібне інтернет-з’єднання.',
            };
            setVoiceError(messages[event.error] ?? 'Не вдалося виконати голосовий пошук.');
        };
        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
        } catch {
            recognitionRef.current = null;
            setIsListening(false);
            setVoiceError('Не вдалося запустити голосовий пошук.');
        }
    };

    return (
        <Item>
            <FormControl variant="outlined" fullWidth error={Boolean(voiceError)}>
                <InputLabel htmlFor={`filter-input`}>Пошук деталі</InputLabel>
                <OutlinedInput
                    id={`filter-input`}
                    type={'text'}
                    value={filterText}
                    onChange={onFilterChange}
                    endAdornment={
                        <InputAdornment position="end">
                            <Tooltip title={isListening ? 'Зупинити прослуховування' : 'Голосовий пошук українською'}>
                                <span>
                                    <IconButton
                                        onClick={isListening ? stopListening : startListening}
                                        disabled={!isVoiceSupported}
                                        color={isListening ? 'error' : 'default'}
                                        aria-label={isListening ? 'Зупинити голосовий пошук' : 'Почати голосовий пошук'}
                                        edge="end"
                                    >
                                        {isListening ? <Stop/> : <Mic/>}
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <IconButton onClick={onClear} edge="end">
                                <Close/>
                            </IconButton>
                        </InputAdornment>
                    }
                />
                <FormHelperText>
                    {voiceError || (isListening
                        ? 'Слухаю… Назвіть деталь українською.'
                        : !isVoiceSupported ? 'Голосовий пошук не підтримується цим браузером.' : ' ')}
                </FormHelperText>
            </FormControl>
        </Item>
    );
}

export default PartsFilter;
