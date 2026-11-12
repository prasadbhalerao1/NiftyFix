import { useState } from 'preact/hooks';
import { SingleFileTool, TextInput, type ToolUiProps } from '@niftyfix/ui';
import { aadhaarPassword } from './aadhaar';
import type { UnlockPdfOptions } from './options';

export default function UnlockPdf(props: ToolUiProps) {
  const aadhaar = props.preset === 'aadhaar';
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const built = aadhaarPassword(name, year);
  const options: UnlockPdfOptions = { password: aadhaar && built ? built : password, fileName: '' };

  return (
    <SingleFileTool
      {...props}
      accept=".pdf,application/pdf"
      chooseTitle="Choose a PDF"
      settingsTitle="Password"
      actionLabel="Remove password"
      busyLabel="Unlocking…"
      successMessage="Your PDF is unlocked. It opens, prints and copies without a password."
      disclaimer="The saved file was opened again without any password and checked for leftover encryption. Only remove passwords from your own documents or ones you have permission to unlock."
      options={options}
    >
      {aadhaar ? (
        <>
          <TextInput
            label="Name as on Aadhaar"
            value={name}
            onChange={setName}
            placeholder="Suresh Kumar"
            testId="aadhaar-name"
          />
          <TextInput
            label="Year of birth"
            value={year}
            onChange={setYear}
            placeholder="1990"
            testId="aadhaar-year"
            hint={
              built
                ? `Password: ${built}`
                : 'The password is the first four letters of your name in capitals and your year of birth.'
            }
          />
        </>
      ) : null}
      {!aadhaar || !built ? (
        <TextInput
          label={aadhaar ? 'Or type the password' : 'PDF password'}
          type="password"
          value={password}
          onChange={setPassword}
          hint="Leave empty if the PDF opens without one: print and copy restrictions are removed anyway."
          testId="pdf-password"
        />
      ) : null}
    </SingleFileTool>
  );
}
