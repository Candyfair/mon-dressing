import { NativeModule, requireNativeModule } from 'expo';

import type { CutoutResult } from './SubjectCutout.types';

declare class SubjectCutoutModule extends NativeModule<Record<string, never>> {
  cutOutSubject(sourceUri: string): Promise<CutoutResult>;
}

export default requireNativeModule<SubjectCutoutModule>('SubjectCutout');
