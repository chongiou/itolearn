// 模拟 Win+Z 触发 Snap Layouts

#[cfg(target_os = "windows")]
use windows::Win32::UI::Input::KeyboardAndMouse::{
    INPUT, INPUT_KEYBOARD, KEYBD_EVENT_FLAGS, KEYBDINPUT, KEYEVENTF_KEYUP, SendInput, VK_LWIN, VK_Z,
};

#[cfg(target_os = "windows")]
pub fn trigger_snap_layouts() -> Result<(), String> {
    unsafe {
        // 创建按键输入事件
        let mut inputs: [INPUT; 4] = [INPUT::default(); 4];

        // Win 键按下
        inputs[0].r#type = INPUT_KEYBOARD;
        inputs[0].Anonymous.ki = KEYBDINPUT {
            wVk: VK_LWIN,
            wScan: 0,
            dwFlags: KEYBD_EVENT_FLAGS(0),
            time: 0,
            dwExtraInfo: 0,
        };

        // Z 键按下
        inputs[1].r#type = INPUT_KEYBOARD;
        inputs[1].Anonymous.ki = KEYBDINPUT {
            wVk: VK_Z,
            wScan: 0,
            dwFlags: KEYBD_EVENT_FLAGS(0),
            time: 0,
            dwExtraInfo: 0,
        };

        // Z 键抬起
        inputs[2].r#type = INPUT_KEYBOARD;
        inputs[2].Anonymous.ki = KEYBDINPUT {
            wVk: VK_Z,
            wScan: 0,
            dwFlags: KEYEVENTF_KEYUP,
            time: 0,
            dwExtraInfo: 0,
        };

        // Win 键抬起
        inputs[3].r#type = INPUT_KEYBOARD;
        inputs[3].Anonymous.ki = KEYBDINPUT {
            wVk: VK_LWIN,
            wScan: 0,
            dwFlags: KEYEVENTF_KEYUP,
            time: 0,
            dwExtraInfo: 0,
        };

        // 发送输入
        let result = SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);

        if result == 0 {
            Err("快捷键输入失败".to_string())
        } else {
            println!("✓ 输入 Win+Z 快捷键");
            Ok(())
        }
    }
}
